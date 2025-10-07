# 🔧 Admin Panel Guide - ReysilvaGen

## Overview

The Admin Panel allows you to configure BIN (Bank Identification Number) patterns that users can select when generating test credit cards. This ensures controlled and consistent test data generation across your organization.

## Accessing Admin Panel

1. Launch the ReysilvaGen application
2. Click the **"🔧 Admin Panel"** button in the sidebar footer
3. Login with your admin credentials

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Important**: Change the default password immediately in production use!

## Features

### 🔐 Authentication

- Secure login with username and password
- Password hashing using PBKDF2 with SHA-512
- Session-based authentication (24-hour expiration)
- Automatic session cleanup on startup

### 💳 BIN Management

Administrators can perform CRUD operations on BIN configurations:

#### Add New BIN

1. Click **"➕ Add New BIN"** button
2. Fill in the form:
   - **BIN Pattern**: 6-9 digit number (e.g., `445566`)
   - **Card Type**: Select from Visa, Mastercard, Amex, etc.
   - **Description**: Optional description for the BIN
3. Click **"💾 Save BIN"**

#### Edit BIN

1. Click the **"✏️"** edit button next to a BIN in the table
2. Modify the fields as needed
3. Click **"💾 Save BIN"**

#### Delete BIN

1. Click the **"🗑️"** delete button next to a BIN
2. Confirm the deletion
3. The BIN will be soft-deleted (marked inactive)

> **Note**: Soft deletion means the BIN is hidden from users but retained in the database for audit purposes.

### ⚙️ Settings

Additional configuration options (coming soon):

- Password change
- Session timeout configuration
- Audit log viewing
- User management

## Database Structure

The application uses SQLite with the following tables:

### `admins`

- `id`: Primary key
- `username`: Unique admin username
- `password_hash`: Hashed password
- `salt`: Password salt
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp

### `bin_configs`

- `id`: Primary key
- `bin_pattern`: The BIN pattern (6-9 digits)
- `card_type`: Type of card (Visa, Mastercard, etc.)
- `description`: Description of the BIN
- `is_active`: Active status (1 = active, 0 = deleted)
- `created_at`: Creation timestamp
- `created_by`: Username of creator

### `sessions`

- `id`: Primary key
- `username`: Associated admin username
- `session_token`: Unique session token
- `created_at`: Session creation timestamp
- `expires_at`: Session expiration timestamp

### `settings`

- `key`: Setting name (primary key)
- `value`: Setting value
- `updated_at`: Last update timestamp

## Default BINs

The system comes pre-configured with 10 default BIN patterns:

| BIN Pattern | Card Type        | Description        |
| ----------- | ---------------- | ------------------ |
| 445566      | Visa             | Standard Visa Test |
| 445577      | Visa             | Visa Alternative   |
| 510000      | Mastercard       | Mastercard Test    |
| 540000      | Mastercard       | Mastercard Debit   |
| 370000      | American Express | Amex Test          |
| 340000      | American Express | Amex Alternative   |
| 601100      | Discover         | Discover Test      |
| 400000      | Visa             | Visa Classic       |
| 411111      | Visa             | Visa Test Card     |
| 555555      | Mastercard       | Mastercard Classic |

## User Experience

When a user opens the main application:

1. BINs are automatically loaded from the database
2. Users see a dropdown with all active BINs
3. Users **cannot** manually enter custom BIN patterns
4. Only pre-configured BINs are available for selection
5. BIN selection shows: `Pattern - Card Type (Description)`

## Security Best Practices

1. **Change Default Password**: Update the default admin password immediately
2. **Limit Admin Access**: Only grant admin access to trusted personnel
3. **Regular Audits**: Monitor BIN configurations regularly
4. **Session Management**: Sessions expire after 24 hours for security
5. **Database Backup**: Regularly backup the `reysilvagen.db` file

## Database Location

The SQLite database is stored in:

- **Windows**: `%APPDATA%/reysilvagen-desktop/reysilvagen.db`
- **macOS**: `~/Library/Application Support/reysilvagen-desktop/reysilvagen.db`
- **Linux**: `~/.config/reysilvagen-desktop/reysilvagen.db`

## Troubleshooting

### Cannot Login

- Verify username and password
- Check if database file exists
- Try restarting the application
- Check console for errors

### BINs Not Loading

- Verify database connection
- Check if BINs are marked as active
- Restart the application
- Open DevTools (Ctrl+Shift+I) to see console errors

### Session Expired

- Sessions automatically expire after 24 hours
- Simply login again with your credentials
- Old sessions are cleaned up automatically

## API Reference (IPC Handlers)

For developers extending the admin panel:

### Authentication

- `admin-login`: Login with credentials
- `admin-verify-session`: Verify session token
- `admin-logout`: Logout and invalidate session

### BIN Management

- `get-all-bins`: Get all BINs (including inactive)
- `get-active-bins`: Get only active BINs
- `add-bin`: Add new BIN configuration
- `update-bin`: Update existing BIN
- `delete-bin`: Soft delete BIN

### Settings

- `get-setting`: Get setting value by key
- `set-setting`: Set or update setting value

## Support

For issues or questions about the Admin Panel:

1. Check the main README.md
2. Review the console logs
3. Check the database file integrity
4. Contact your system administrator

---

**Version**: 2.0.0  
**Last Updated**: October 2025  
**Developed by**: Reysilva
