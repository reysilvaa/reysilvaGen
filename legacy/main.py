"""Reysilvagen: Reysilva's BIN-based card generator and random US address fetcher for QA testing.

Developed and maintained by Reysilva. All usage must adhere to the testing-only
policy noted below.
"""

from __future__ import annotations

import argparse
import csv
import html
import io
import json
import re
import secrets
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Dict, List, Optional, Set, Tuple

CardRecord = Dict[str, str]
ADDRESS_LABELS = ["Street", "City", "State/province/area", "Zip code"]
ADDRESS_URL = "https://www.bestrandoms.com/random-address-in-us?quantity=1"
ADDRESS_HEADERS = {"User-Agent": "Mozilla/5.0"}
MODE_CARDS = "cards"
MODE_ADDRESS = "address"
MODE_BOTH = "cards_then_address"

WARNING_MESSAGE = (
    "WARNING: Generated card data is for development and QA testing only. "
    "Attempting real transactions is illegal. Owned and maintained by Reysilva."
)

# ---------------------------------------------------------------------------
# Luhn helpers
# ---------------------------------------------------------------------------

def luhn_checksum(card_number: str) -> int:
    """Return the Luhn check digit for the provided partial card number."""
    if not card_number.isdigit():
        raise ValueError("Card number must contain only digits")

    total = 0
    for index, digit_char in enumerate(reversed(card_number), start=2):
        digit = int(digit_char)
        if index % 2 == 0:
            doubled = digit * 2
            total += doubled - 9 if doubled > 9 else doubled
        else:
            total += digit
    return (10 - (total % 10)) % 10


def validate_luhn(card_number: str) -> bool:
    """Return True if the complete card number satisfies the Luhn checksum."""
    if not card_number or not card_number.isdigit():
        return False
    check_digit = int(card_number[-1])
    try:
        expected = luhn_checksum(card_number[:-1])
    except ValueError:
        return False
    return check_digit == expected


# ---------------------------------------------------------------------------
# Card generator
# ---------------------------------------------------------------------------

MIN_CARD_LENGTH = 13
MAX_CARD_LENGTH = 19
BIN_MIN_LENGTH = 6
BIN_MAX_LENGTH = 9


class CardGenerator:
    """Generate synthetic card numbers, CVVs, and expiry dates for testing."""

    def __init__(self) -> None:
        self._rand = secrets.SystemRandom()

    def generate_from_bin(self, bin_pattern: str, length: Optional[int] = None) -> str:
        pattern = self._normalize_pattern(bin_pattern)
        prefix = self._extract_prefix(pattern)
        target_length = self._determine_length(pattern, length)

        if target_length <= len(prefix):
            raise ValueError("Card length must be greater than the BIN prefix length")
        if len(pattern) > target_length:
            raise ValueError("Card length cannot be shorter than the BIN pattern length")

        digits: List[Optional[str]] = []
        for index in range(target_length):
            if index < len(pattern):
                char = pattern[index]
                digits.append(None if char == "x" else char)
            else:
                digits.append(None)

        last_index = target_length - 1
        for index in range(last_index):
            if digits[index] is None:
                digits[index] = str(self._rand.randrange(0, 10))

        partial = "".join(digit or "0" for digit in digits[:last_index])
        if not partial.isdigit():
            raise ValueError("BIN pattern must resolve to digits before the check digit")

        check_digit = str(luhn_checksum(partial))
        last_digit = digits[last_index]
        if last_digit is None:
            digits[last_index] = check_digit
        elif last_digit != check_digit:
            raise ValueError("BIN pattern conflicts with required Luhn check digit")

        card_number = "".join(digit or "0" for digit in digits)
        if not validate_luhn(card_number):
            raise ValueError("Generated card number failed Luhn validation")
        return card_number

    def generate_cvv(self, card_type: str = "visa", length_override: Optional[int] = None) -> str:
        if length_override is not None:
            if length_override not in (3, 4):
                raise ValueError("CVV length override must be 3 or 4 digits")
            target_length = length_override
        elif card_type.lower() == "amex":
            target_length = 4
        else:
            target_length = 3

        return "".join(str(self._rand.randrange(0, 10)) for _ in range(target_length))

    def generate_expiry(
        self,
        years_ahead: int = 5,
        month: Optional[int] = None,
        year: Optional[int] = None,
    ) -> Tuple[str, str]:
        if years_ahead < 0:
            raise ValueError("years_ahead must be non-negative")

        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year
        max_year = current_year + years_ahead

        if month is not None or year is not None:
            if month is None or year is None:
                raise ValueError("Both month and year are required when specifying expiry")
            if not 1 <= month <= 12:
                raise ValueError("Expiry month must be between 1 and 12")
            full_year = year + 2000 if year < 100 else year
            if full_year < current_year or full_year > max_year:
                raise ValueError("Expiry year must be within the allowed range")
            return f"{month:02d}", f"{full_year % 100:02d}"

        total_months = years_ahead * 12 + 1
        offset = self._rand.randrange(0, total_months)
        expiry_month = ((current_month - 1 + offset) % 12) + 1
        expiry_year = current_year + (current_month - 1 + offset) // 12
        return f"{expiry_month:02d}", f"{expiry_year % 100:02d}"

    def generate_bulk(
        self,
        bin_pattern: str,
        count: int,
        length: Optional[int] = None,
        cvv_length: Optional[int] = None,
        years_ahead: int = 5,
        expiry_month: Optional[int] = None,
        expiry_year: Optional[int] = None,
    ) -> List[CardRecord]:
        if count <= 0:
            raise ValueError("Count must be a positive integer")

        card_type = detect_card_type(bin_pattern)
        unique_numbers: Set[str] = set()
        cards: List[CardRecord] = []
        max_attempts = max(count * 10, 1000)
        attempts = 0

        fixed_expiry: Optional[Tuple[str, str]] = None
        if expiry_month is not None or expiry_year is not None:
            fixed_expiry = self.generate_expiry(
                years_ahead=years_ahead,
                month=expiry_month,
                year=expiry_year,
            )

        while len(cards) < count:
            attempts += 1
            if attempts > max_attempts:
                raise RuntimeError("Exceeded attempts while generating unique cards")

            number = self.generate_from_bin(bin_pattern, length)
            if number in unique_numbers:
                continue
            unique_numbers.add(number)

            cvv = self.generate_cvv(card_type=card_type, length_override=cvv_length)
            if fixed_expiry is not None:
                exp_month, exp_year = fixed_expiry
            else:
                exp_month, exp_year = self.generate_expiry(years_ahead=years_ahead)

            cards.append(
                {
                    "number": number,
                    "cvv": cvv,
                    "exp_month": exp_month,
                    "exp_year": exp_year,
                }
            )

        return cards

    def _normalize_pattern(self, bin_pattern: str) -> str:
        if not bin_pattern:
            raise ValueError("BIN pattern must not be empty")
        pattern = bin_pattern.replace(" ", "").lower()
        allowed = set("0123456789x")
        if any(char not in allowed for char in pattern):
            raise ValueError("BIN pattern may contain only digits and 'x'")
        return pattern

    def _extract_prefix(self, pattern: str) -> str:
        digits = []
        for char in pattern:
            if char.isdigit():
                digits.append(char)
            else:
                break
        prefix = "".join(digits)
        if not prefix.isdigit():
            raise ValueError("BIN pattern must start with digits")
        if not (BIN_MIN_LENGTH <= len(prefix) <= BIN_MAX_LENGTH):
            raise ValueError("BIN must be 6-9 digits long before placeholders")
        return prefix

    def _determine_length(self, pattern: str, length: Optional[int]) -> int:
        if length is None:
            inferred = len(pattern) if "x" in pattern else max(len(pattern), 16)
        else:
            inferred = length
        if not (MIN_CARD_LENGTH <= inferred <= MAX_CARD_LENGTH):
            raise ValueError("Card length must be between 13 and 19 digits")
        return inferred


# ---------------------------------------------------------------------------
# Card type detection
# ---------------------------------------------------------------------------

def detect_card_type(bin_pattern: str) -> str:
    digits = "".join(char for char in bin_pattern if char.isdigit())
    if not digits:
        return "unknown"

    if digits.startswith("4"):
        return "visa"

    first_two = digits[:2]
    if first_two in {"51", "52", "53", "54", "55"}:
        return "mastercard"

    if len(digits) >= 4:
        first_four = int(digits[:4])
        if 2221 <= first_four <= 2720:
            return "mastercard"

    if first_two in {"34", "37"}:
        return "amex"

    if len(digits) >= 4 and digits[:4] == "6011":
        return "discover"

    if first_two in {"64", "65"}:
        return "discover"

    return "unknown"


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

def format_plain(cards: List[CardRecord]) -> str:
    return "\n".join(card["number"] for card in cards)


def format_pipe(cards: List[CardRecord]) -> str:
    lines = [
        f"{card['number']}|{card['exp_month']}|{card['exp_year']}|{card['cvv']}"
        for card in cards
    ]
    return "\n".join(lines)


def format_csv(cards: List[CardRecord]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["card_number", "exp_month", "exp_year", "cvv"])
    for card in cards:
        writer.writerow([card["number"], card["exp_month"], card["exp_year"], card["cvv"]])
    return buffer.getvalue().rstrip("\n")


def format_json(cards: List[CardRecord]) -> str:
    return json.dumps(cards, indent=2)


FORMATTERS: Dict[str, Callable[[List[CardRecord]], str]] = {
    "plain": format_plain,
    "pipe": format_pipe,
    "csv": format_csv,
    "json": format_json,
}


# ---------------------------------------------------------------------------
# Random address helper
# ---------------------------------------------------------------------------

ADDRESS_PATTERN_TEMPLATE = r"<b>{label}:?\s*</b>\s*(?:&nbsp;|\s)*([^<]+)"


def parse_random_address(html_text: str) -> Dict[str, str]:
    """Parse address fields from the BestRandoms HTML payload."""
    results: Dict[str, str] = {}
    for label in ADDRESS_LABELS:
        pattern = ADDRESS_PATTERN_TEMPLATE.format(label=re.escape(label))
        match = re.search(pattern, html_text, flags=re.IGNORECASE)
        if not match:
            raise ValueError(f"Could not parse {label.lower()}")
        value = html.unescape(match.group(1)).strip()
        results[label] = value
    return results


def fetch_random_us_address(url: str = ADDRESS_URL) -> Dict[str, str]:
    """Fetch a random US address and return the parsed fields."""
    request = urllib.request.Request(url, headers=ADDRESS_HEADERS)
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            html_text = response.read().decode("utf-8")
    except urllib.error.URLError as exc:  # pragma: no cover - network errors
        raise RuntimeError(f"Failed to fetch address: {exc}") from exc
    return parse_random_address(html_text)


def display_us_address(address: Dict[str, str]) -> None:
    for label in ADDRESS_LABELS:
        print(f"{label}: {address[label]}")


# ---------------------------------------------------------------------------
# Interactive helpers
# ---------------------------------------------------------------------------

def _read_line(prompt: str) -> str:
    try:
        return input(prompt)
    except EOFError:  # pragma: no cover - input stream terminated
        return ""


def _prompt_mode_selection() -> str:
    print("Select a mode:\n1. Generate test credit cards\n2. Fetch a random US address\n3. Generate cards then fetch an address")
    while True:
        choice = _read_line("Enter 1, 2, or 3: ").strip()
        if choice == "1":
            return MODE_CARDS
        if choice == "2":
            return MODE_ADDRESS
        if choice == "3":
            return MODE_BOTH
        print("Please enter 1, 2, or 3.")


def _prompt_required_text(prompt: str) -> str:
    while True:
        value = _read_line(prompt).strip()
        if value:
            return value
        print("Input is required.")


def _prompt_optional_text(prompt: str) -> Optional[str]:
    value = _read_line(prompt).strip()
    return value or None


def _prompt_int(
    prompt: str,
    *,
    default: Optional[int] = None,
    minimum: Optional[int] = None,
    maximum: Optional[int] = None,
    allowed: Optional[Set[int]] = None,
    allow_blank: bool = False,
) -> Optional[int]:
    while True:
        raw = _read_line(prompt).strip()
        if not raw:
            if default is not None:
                return default
            if allow_blank:
                return None
            print("Input is required.")
            continue
        try:
            value = int(raw)
        except ValueError:
            print("Please enter a valid integer.")
            continue
        if allowed is not None and value not in allowed:
            allowed_values = ", ".join(str(item) for item in sorted(allowed))
            print(f"Value must be one of: {allowed_values}.")
            continue
        if minimum is not None and value < minimum:
            print(f"Value must be at least {minimum}.")
            continue
        if maximum is not None and value > maximum:
            print(f"Value must be at most {maximum}.")
            continue
        return value


def _prompt_choice(prompt: str, options: List[str], default: Optional[str]) -> str:
    option_lookup = {option.lower(): option for option in options}
    while True:
        raw = _read_line(prompt).strip().lower()
        if not raw:
            if default:
                return default
            print("Input is required.")
            continue
        if raw in option_lookup:
            return option_lookup[raw]
        print(f"Please choose one of: {', '.join(options)}.")


def _prompt_yes_no(prompt: str, *, default: bool = False) -> bool:
    while True:
        raw = _read_line(prompt).strip().lower()
        if not raw:
            return default
        if raw in {"y", "yes"}:
            return True
        if raw in {"n", "no"}:
            return False
        print("Please respond with 'y' or 'n'.")


def _collect_interactive_config(args: argparse.Namespace) -> None:
    print("\nInteractive mode: press Enter to accept defaults where available.\n")

    args.bin = _prompt_required_text(
        "BIN pattern (6-9 digits, optional 'x' placeholders): "
    ).replace(" ", "").lower()

    args.length = _prompt_int(
        "Card length (13-19, leave blank for auto): ",
        minimum=13,
        maximum=19,
        allow_blank=True,
    )

    args.count = _prompt_int(
        "How many cards to generate? [10]: ",
        default=10,
        minimum=1,
    ) or 10

    formats = sorted(FORMATTERS.keys())
    default_format = args.format or "pipe"
    format_prompt = f"Output format {formats} [default: {default_format}]: "
    args.format = _prompt_choice(format_prompt, formats, default_format)

    args.output = _prompt_optional_text("Output file path (leave blank for stdout): ")

    if _prompt_yes_no("Override CVV length? (y/N): "):
        args.cvv_length = _prompt_int(
            "CVV length (3 or 4): ",
            allowed={3, 4},
        )
    else:
        args.cvv_length = None

    if _prompt_yes_no("Use a fixed expiry date? (y/N): "):
        args.expiry_month = _prompt_int(
            "Expiry month (1-12): ",
            minimum=1,
            maximum=12,
        )
        args.expiry_year = _prompt_int(
            "Expiry year (YY or YYYY): ",
            minimum=0,
        )
    else:
        args.expiry_month = None
        args.expiry_year = None
        args.years_ahead = _prompt_int(
            "Maximum years ahead for expiry [5]: ",
            default=5,
            minimum=0,
        ) or 5


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_arguments(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Generate synthetic credit card numbers from a BIN pattern for QA/testing or "
            "fetch a random US address. Numbers are Luhn valid but have no monetary value. "
            "Created by Reysilva."
        ),
        epilog=(
            "Use responsibly. Do not attempt fraud. Ensure compliance with local regulations."
        ),
    )
    parser.add_argument(
        "--mode",
        choices=[MODE_CARDS, MODE_ADDRESS, MODE_BOTH],
        help="Select 'cards', 'address', or 'cards_then_address' (cards followed by address).",
    )
    parser.add_argument(
        "--bin",
        "-b",
        help="BIN or BIN pattern (digits with optional 'x' placeholders).",
    )
    parser.add_argument(
        "--count",
        "-c",
        type=int,
        default=10,
        help="Number of cards to generate (default: 10).",
    )
    parser.add_argument(
        "--length",
        "-l",
        type=int,
        help="Total card number length (13-19). Defaults based on BIN pattern.",
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=sorted(FORMATTERS.keys()),
        default="pipe",
        help="Output format (plain, pipe, csv, json).",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Optional file path to write the generated data.",
    )
    parser.add_argument(
        "--cvv-length",
        type=int,
        choices=[3, 4],
        help="Override CVV length (default based on card type).",
    )
    parser.add_argument(
        "--expiry-month",
        type=int,
        help="Force expiry month (01-12). Must be used with --expiry-year.",
    )
    parser.add_argument(
        "--expiry-year",
        type=int,
        help="Force expiry year (YY or YYYY). Must be used with --expiry-month.",
    )
    parser.add_argument(
        "--years-ahead",
        type=int,
        default=5,
        help="Maximum years ahead for random expiry (default: 5).",
    )
    parser.add_argument(
        "--interactive",
        "-i",
        action="store_true",
        help="Launch prompts to collect generation options interactively.",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in self tests and exit.",
    )
    return parser.parse_args(argv)

def _determine_mode(args: argparse.Namespace) -> str:
    if args.mode:
        return args.mode

    card_related = any(
        value is not None
        for value in (
            args.bin,
            args.length,
            args.output,
            args.cvv_length,
            args.expiry_month,
            args.expiry_year,
        )
    ) or args.count != 10 or args.format != "pipe" or args.interactive or args.self_test
    if card_related:
        return MODE_CARDS

    return _prompt_mode_selection()


def main(argv: Optional[List[str]] = None) -> int:
    args = parse_arguments(argv)

    if args.self_test:
        success = _run_self_tests()
        return 0 if success else 1

    mode = _determine_mode(args)

    cards: List[Dict[str, str]] = []

    if mode in {MODE_CARDS, MODE_BOTH}:
        generator = CardGenerator()

        if args.interactive or not args.bin:
            while True:
                _collect_interactive_config(args)
                try:
                    cards = generator.generate_bulk(
                        bin_pattern=args.bin,
                        count=args.count,
                        length=args.length,
                        cvv_length=args.cvv_length,
                        years_ahead=args.years_ahead,
                        expiry_month=args.expiry_month,
                        expiry_year=args.expiry_year,
                    )
                    break
                except (ValueError, RuntimeError) as exc:
                    print(f"Error: {exc}", file=sys.stderr)
                    if not _prompt_yes_no("Try again? (y/N): "):
                        return 1
        else:
            cards = generator.generate_bulk(
                bin_pattern=args.bin,
                count=args.count,
                length=args.length,
                cvv_length=args.cvv_length,
                years_ahead=args.years_ahead,
                expiry_month=args.expiry_month,
                expiry_year=args.expiry_year,
            )

        formatter = FORMATTERS[args.format]
        rendered = formatter(cards)

        if args.output:
            path_out = Path(args.output)
            try:
                path_out.write_text(
                    rendered + ("\n" if rendered and not rendered.endswith("\n") else ""),
                    encoding="utf-8",
                )
            except OSError as exc:
                print(f"Error writing output: {exc}", file=sys.stderr)
                return 1
        else:
            print(rendered)

        print(WARNING_MESSAGE, file=sys.stderr)

        if mode == MODE_BOTH and not args.output:
            print()

    if mode in {MODE_ADDRESS, MODE_BOTH}:
        address = fetch_random_us_address()
        display_us_address(address)

    return 0


# ---------------------------------------------------------------------------
# Self tests
# ---------------------------------------------------------------------------

def _run_self_tests() -> bool:
    import unittest

    class ValidatorTests(unittest.TestCase):
        def test_luhn_checksum(self) -> None:
            self.assertEqual(luhn_checksum("7992739871"), 3)
            self.assertEqual(luhn_checksum("411111111111111"), 1)

        def test_validate_luhn(self) -> None:
            valid_cards = [
                "4111111111111111",
                "5555555555554444",
                "378282246310005",
            ]
            for card in valid_cards:
                self.assertTrue(validate_luhn(card))

        def test_reject_invalid(self) -> None:
            for card in ["4111111111111112", "abcdef", ""]:
                self.assertFalse(validate_luhn(card))

    class GeneratorTests(unittest.TestCase):
        def setUp(self) -> None:
            self.generator = CardGenerator()

        def test_generate_from_bin(self) -> None:
            card = self.generator.generate_from_bin("445566", length=16)
            self.assertTrue(card.startswith("445566"))
            self.assertEqual(len(card), 16)
            self.assertTrue(validate_luhn(card))

        def test_generate_from_pattern(self) -> None:
            card = self.generator.generate_from_bin("378282xxxxxxxxx")
            self.assertEqual(len(card), 15)
            self.assertTrue(card.startswith("378282"))

        def test_bulk_unique(self) -> None:
            cards = self.generator.generate_bulk("555555", count=20, length=16)
            numbers = [card["number"] for card in cards]
            self.assertEqual(len(numbers), len(set(numbers)))

        def test_fixed_expiry(self) -> None:
            cards = self.generator.generate_bulk(
                "601100",
                count=5,
                length=16,
                expiry_month=12,
                expiry_year=2030,
            )
            for card in cards:
                self.assertEqual(card["exp_month"], "12")
                self.assertEqual(card["exp_year"], "30")

    class FormatterTests(unittest.TestCase):
        SAMPLE = [
            {"number": "4111111111111111", "exp_month": "01", "exp_year": "30", "cvv": "123"},
            {"number": "5555555555554444", "exp_month": "06", "exp_year": "28", "cvv": "321"},
        ]

        def test_plain(self) -> None:
            rendered = format_plain(self.SAMPLE)
            self.assertIn("4111111111111111", rendered)

        def test_pipe(self) -> None:
            rendered = format_pipe(self.SAMPLE)
            self.assertIn("4111111111111111|01|30|123", rendered)

        def test_csv(self) -> None:
            rendered = format_csv(self.SAMPLE)
            self.assertTrue(rendered.startswith("card_number"))

        def test_json(self) -> None:
            rendered = format_json(self.SAMPLE)
            parsed = json.loads(rendered)
            self.assertEqual(parsed[1]["cvv"], "321")

    suite = unittest.TestSuite()
    suite.addTest(unittest.defaultTestLoader.loadTestsFromTestCase(ValidatorTests))
    suite.addTest(unittest.defaultTestLoader.loadTestsFromTestCase(GeneratorTests))
    suite.addTest(unittest.defaultTestLoader.loadTestsFromTestCase(FormatterTests))
    result = unittest.TextTestRunner(verbosity=1).run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":  # pragma: no cover
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)