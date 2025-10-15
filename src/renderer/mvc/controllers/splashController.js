/**
 * Splash Screen Controller
 * Manages splash screen progress, status updates, and initialization flow
 * @module mvc/controllers/SplashController
 */

class SplashController extends BaseController {
  constructor() {
    super('Splash', { autoInit: false });
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.realProgressReceived = false;
    this.animationFrame = null;
  }

  async onInit() {
    this.setupElements();
    this.setupProgressListener();
    this.startInitializationSequence();
  }

  setupElements() {
    this.elements = this.getElements([
      'progress-bar',
      'loading-status', 
      'progress-text'
    ]);

    if (!this.elements['progress-bar']) {
      this.log('error', 'Required splash elements not found');
      return;
    }

    this.log('info', 'Splash elements initialized');
  }

  setupProgressListener() {
    // Listen for progress updates from main process
    if (window.splashAPI && window.splashAPI.onProgress) {
      window.splashAPI.onProgress((progress, status) => {
        this.updateProgress(progress, status);
        // Cancel simulation if real progress is received
        if (progress > 0) {
          this.realProgressReceived = true;
        }
      });
      this.log('info', 'Progress listener established');
    } else {
      this.log('warn', 'SplashAPI not available, using simulation only');
    }

  }

  updateProgress(progress, status) {
    this.targetProgress = Math.max(0, Math.min(100, progress));
    
    if (status && this.elements['loading-status']) {
      this.elements['loading-status'].textContent = status;
    }
    
    this.animateProgress();
    this.log('debug', `Progress updated: ${progress}% - ${status}`);
  }

  animateProgress() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    const animate = () => {
      if (Math.abs(this.currentProgress - this.targetProgress) < 0.5) {
        this.currentProgress = this.targetProgress;
      } else {
        this.currentProgress += (this.targetProgress - this.currentProgress) * 0.1;
      }
      
      if (this.elements['progress-bar']) {
        this.elements['progress-bar'].style.width = this.currentProgress + '%';
      }
      
      if (this.elements['progress-text']) {
        this.elements['progress-text'].textContent = Math.round(this.currentProgress) + '%';
      }
      
      if (this.currentProgress !== this.targetProgress) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  async startInitializationSequence() {
    // Simulate loading steps if no real progress is received
    this.realProgressReceived = false;
    
    const initializationSteps = [
      { progress: 5, status: 'Starting application...', delay: 100 },
      { progress: 15, status: 'Loading configuration...', delay: 200 },
      { progress: 30, status: 'Initializing MVC architecture...', delay: 400 },
      { progress: 45, status: 'Loading base classes...', delay: 300 },
      { progress: 60, status: 'Loading models...', delay: 300 },
      { progress: 75, status: 'Loading views...', delay: 300 },
      { progress: 90, status: 'Loading controllers...', delay: 300 },
      { progress: 98, status: 'Finalizing initialization...', delay: 200 },
      { progress: 100, status: 'Ready!', delay: 100 }
    ];

    let stepIndex = 0;
    
    const executeStep = async () => {
      // Stop simulation if real progress is received
      if (this.realProgressReceived) {
        this.log('info', 'Real progress received, stopping simulation');
        return;
      }
      
      if (stepIndex < initializationSteps.length) {
        const step = initializationSteps[stepIndex];
        
        await this.delay(step.delay);
        
        if (!this.realProgressReceived) {
          this.updateProgress(step.progress, step.status);
          stepIndex++;
          await executeStep();
        }
      } else {
        // Initialization complete
        await this.delay(500);
        this.onInitializationComplete();
      }
    };

    // Start simulation after a short delay
    await this.delay(300);
    await executeStep();
  }

  onInitializationComplete() {
    this.log('success', 'Splash initialization sequence completed');
    
    // Notify main process that splash is ready to close
    if (window.splashAPI && window.splashAPI.ready) {
      window.splashAPI.ready();
    }
    
    // Auto-close after a brief delay if not handled by main process
    setTimeout(() => {
      if (window.splashAPI && window.splashAPI.close) {
        window.splashAPI.close();
      }
    }, 800);
  }

  // Public methods for external control
  setProgress(progress, status) {
    this.realProgressReceived = true;
    this.updateProgress(progress, status);
  }

  setStatus(status) {
    if (this.elements['loading-status']) {
      this.elements['loading-status'].textContent = status;
    }
  }

  complete() {
    this.realProgressReceived = true;
    this.updateProgress(100, 'Ready!');
    setTimeout(() => this.onInitializationComplete(), 300);
  }


  onDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.log('info', 'Splash controller cleaned up');
  }
}

// Initialize splash controller when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const splashController = new SplashController();
    await splashController.init();
    
    // Store reference globally for external access
    window.splashController = splashController;
  } catch (error) {
    console.error('❌ Failed to initialize Splash controller:', error);
  }
});

// Export for compatibility
window.SplashController = SplashController;
