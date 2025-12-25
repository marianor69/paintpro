/**
 * English (en) translations for Paint Pro
 * Organized by screen and component for easy maintenance
 */

export default {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    next: 'Next',
    back: 'Back',
    done: 'Done',
    close: 'Close',
    add: 'Add',
    edit: 'Edit',
    remove: 'Remove',
    continue: 'Continue',
    required: 'Required',
    optional: 'Optional',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    loading: 'Loading...',
    noData: 'No data available',
    noItems: 'No items yet',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    copy: 'Copy',
    share: 'Share',
    settings: 'Settings',
  },

  steps: {
    setup: 'Setup',
    buildEstimate: 'Build Estimate',
    sendToClient: 'Send to Client',
    step: 'Step',
    of: 'of',
    completed: 'Completed',
    current: 'Current',
    incomplete: 'Incomplete',
    completeStepToAdvance: 'Complete this step to advance',
  },

  screens: {
    home: {
      title: 'Paint Pro',
      subtitle: 'Painting Estimation Made Easy',
      createNewProject: 'Create New Project',
      myProjects: 'My Projects',
      noProjects: 'No projects yet',
      noProjectsSubtitle: 'Create your first project to get started',
      recentProjects: 'Recent Projects',
      allProjects: 'All Projects',
      projectsCount: 'projects',
      emptyState: 'Get started by creating a new project',
    },

    projectSetup: {
      title: 'Project Setup',
      subtitle: 'Tell us about the project',

      clientInfo: {
        title: 'Client Information',
        clientName: 'Client Name',
        clientNamePlaceholder: 'Enter client name',
        address: 'Address',
        addressPlaceholder: 'Street address',
        city: 'City',
        cityPlaceholder: 'City',
        state: 'State',
        statePlaceholder: 'State',
        zipCode: 'Zip Code',
        zipCodePlaceholder: 'Zip code',
        country: 'Country',
        countryPlaceholder: 'Country',
        phone: 'Phone',
        phonePlaceholder: '(123) 456-7890',
        email: 'Email',
        emailPlaceholder: 'email@example.com',
        photo: 'Project Photo',
        takePhoto: 'Take Photo',
        uploadPhoto: 'Upload Photo',
        removePhoto: 'Remove Photo',
      },

      projectDefaults: {
        title: 'Project Defaults',
        subtitle: 'What will you be painting?',
        paintWalls: 'Paint Walls',
        paintCeilings: 'Paint Ceilings',
        paintTrim: 'Paint Trim',
        paintBaseboards: 'Paint Baseboards',
        paintDoors: 'Paint Doors',
        paintDoorJambs: 'Paint Door Jambs',
        paintCrownMoulding: 'Paint Crown Moulding',
        paintClosetInteriors: 'Paint Closet Interiors',
        paintWindowFrames: 'Paint Window Frames',
        defaultCoats: 'Default Number of Coats',
        coatsForWalls: 'Coats for Walls',
        coatsForCeilings: 'Coats for Ceilings',
        coatsForTrim: 'Coats for Trim',
        coatsForDoors: 'Coats for Doors',
        oneCoat: '1 Coat',
        twoCoats: '2 Coats',
      },

      floors: {
        title: 'Project Floors',
        subtitle: 'How many floors?',
        numberOfFloors: 'Number of Floors',
        floorHeight: 'Floor Height',
        floorLabel: 'Floor',
        addFloor: 'Add Floor',
        removeFloor: 'Remove Floor',
        floorHeightHelp: 'Typical residential ceiling height is 8-9 feet',
      },

      buttons: {
        saveAndContinue: 'Save & Continue to Build Estimate',
        saveDraft: 'Save Draft',
      },

      validation: {
        clientNameRequired: 'Client name is required',
        addressRequired: 'Address is required',
        invalidEmail: 'Please enter a valid email',
        invalidPhone: 'Please enter a valid phone number',
        floorHeightRequired: 'Floor height is required',
        floorHeightInvalid: 'Floor height must be a valid number',
      },
    },

    projectDetail: {
      title: 'Build Estimate',
      subtitle: 'Add rooms and features to your estimate',

      projectSummary: {
        title: 'Project Summary',
        client: 'Client',
        address: 'Address',
        totalEstimate: 'Total Estimate',
      },

      guidedActions: {
        title: 'Add to Your Estimate',
        addRooms: 'Add Rooms',
        addStaircases: 'Add Staircases',
        addFireplaces: 'Add Fireplaces',
        addBuiltIns: 'Add Built-Ins',
        roomsCount: 'rooms',
        staircasesCount: 'staircases',
        fireplacesCount: 'fireplaces',
        builtInsCount: 'built-ins',
      },

      review: {
        title: 'Review & Customize',
        viewAllRooms: 'View All Rooms',
        customizeQuote: 'Customize Quote',
        materialsSummary: 'Materials Summary',
        laborSummary: 'Labor Summary',
      },

      validation: {
        addAtLeastOne: 'Add at least one room, staircase, fireplace, or built-in to continue',
        completeProjectSetup: 'Complete project setup to begin adding items',
      },

      buttons: {
        continueToSend: 'Continue to Send Proposal',
        addRoom: 'Add Room',
        addStaircase: 'Add Staircase',
        addFireplace: 'Add Fireplace',
        addBuiltIn: 'Add Built-In',
      },
    },

    roomEditor: {
      title: 'Edit Room',
      subtitle: 'Room details and measurements',

      roomInfo: {
        title: 'Room Information',
        roomName: 'Room Name',
        roomNamePlaceholder: 'e.g., Master Bedroom',
        floor: 'Floor',
      },

      dimensions: {
        title: 'Dimensions',
        length: 'Length',
        width: 'Width',
        height: 'Height (Ceiling Height)',
        manualArea: 'Manual Area (Optional)',
        manualAreaHelp: 'Override calculated ceiling area if needed',
      },

      ceiling: {
        title: 'Ceiling Type',
        flat: 'Flat Ceiling',
        cathedral: 'Cathedral/Vaulted Ceiling',
        peakHeight: 'Peak Height (at highest point)',
        peakHeightHelp: 'Measure from floor to highest point',
      },

      openings: {
        title: 'Openings',
        windows: 'Windows',
        doors: 'Doors',
        passThroughs: 'Pass-Throughs / Openings',
        closets: 'Closets',
        singleDoorClosets: 'Single-Door Closets',
        doubleDoorClosets: 'Double-Door Closets',
        includeClosetInteriors: 'Include Closet Interiors',
        addOpening: 'Add Opening',
        openingWidth: 'Opening Width',
        openingHeight: 'Opening Height',
        interiorTrim: 'Interior Trim',
        exteriorTrim: 'Exterior Trim',
      },

      paintOptions: {
        title: 'Paint Options',
        paintWalls: 'Paint Walls',
        paintCeilings: 'Paint Ceilings',
        paintTrim: 'Paint Trim',
        paintDoors: 'Paint Doors',
        paintWindowFrames: 'Paint Window Frames',
        paintDoorFrames: 'Paint Door Frames',
        paintBaseboards: 'Paint Baseboards',
        paintCrownMoulding: 'Paint Crown Moulding',
        multipleColors: 'Multiple Colors / Accent Wall',
        numberOfCoats: 'Number of Coats',
      },

      notes: {
        title: 'Notes',
        addNotes: 'Add notes about this room',
        notesPlaceholder: 'Any special requirements or observations?',
      },

      photos: {
        title: 'Room Photos',
        addPhoto: 'Add Photo',
        takePhoto: 'Take Photo',
        uploadPhoto: 'Upload Photo',
        photoNote: 'Photo Note',
        photoNoteHelp: 'Add details about what\'s in the photo',
      },

      calculation: {
        title: 'Calculation Preview',
        wallArea: 'Wall Area',
        ceilingArea: 'Ceiling Area',
        baseboardLF: 'Baseboard (Linear Feet)',
        crownMouldingLF: 'Crown Moulding (Linear Feet)',
        laborCost: 'Labor Cost',
        materialsCost: 'Materials Cost',
        totalCost: 'Total Cost',
      },

      buttons: {
        saveRoom: 'Save Room',
        discardChanges: 'Discard Changes',
        delete: 'Delete Room',
      },

      validation: {
        roomNameRequired: 'Room name is required',
        lengthRequired: 'Length is required',
        widthRequired: 'Width is required',
        heightRequired: 'Height is required',
        invalidDimensions: 'Please enter valid dimensions',
      },
    },

    staircaseEditor: {
      title: 'Edit Staircase',

      dimensions: {
        risers: 'Number of Risers',
        handrailLength: 'Handrail Length',
        spindles: 'Number of Spindles',
      },

      secondaryStairwell: {
        title: 'Secondary Stairwell',
        enabled: 'Include Secondary Stairwell',
        tallWallHeight: 'Tall Wall Height',
        shortWallHeight: 'Short Wall Height',
        doubleSidedWalls: 'Double-Sided Stair Walls',
      },

      buttons: {
        saveStaircase: 'Save Staircase',
        delete: 'Delete Staircase',
      },
    },

    fireplaceEditor: {
      title: 'Edit Fireplace',

      dimensions: {
        width: 'Width',
        height: 'Height',
        depth: 'Depth',
      },

      trim: {
        hasTrim: 'Include Trim',
        trimLinearFeet: 'Trim Linear Feet',
      },

      buttons: {
        saveFireplace: 'Save Fireplace',
        delete: 'Delete Fireplace',
      },
    },

    builtInEditor: {
      title: 'Edit Built-In',

      info: {
        name: 'Built-In Name',
        width: 'Width',
        height: 'Height',
        depth: 'Depth',
      },

      shelves: {
        shelfCount: 'Number of Shelves',
      },

      buttons: {
        saveBuiltIn: 'Save Built-In',
        delete: 'Delete Built-In',
      },
    },

    quoteBuilder: {
      title: 'Customize Quote',
      subtitle: 'Choose what to include in the estimate',

      presets: {
        title: 'Quick Presets',
        fullInterior: 'Full Interior',
        wallsAndCeilings: 'Walls & Ceilings',
        wallsOnly: 'Walls Only',
        ceilingsOnly: 'Ceilings Only',
        trimPackage: 'Trim Package',
        rentalRefresh: 'Rental Refresh',
        resetAll: 'Reset All',
      },

      scope: {
        title: 'Scope',
        byFloor: 'By Floor',
        includeAllFloors: 'Include All Floors',
        byRoom: 'By Room',
        includeAllRooms: 'Include All Rooms',
        selectRooms: 'Select Rooms',
        byFeature: 'By Feature',
        includeStaircases: 'Include Staircases',
        includeFireplaces: 'Include Fireplaces',
        includeBuiltIns: 'Include Built-Ins',
      },

      categories: {
        title: 'Paint Categories',
        walls: 'Walls',
        ceilings: 'Ceilings',
        trim: 'Trim',
        baseboards: 'Baseboards',
        windows: 'Windows',
        doors: 'Doors',
        closets: 'Closets',
        primer: 'Primer',
      },

      paintOptions: {
        title: 'Paint Options',
        showPaintOptions: 'Show Paint Options in Proposal',
        good: 'Good',
        better: 'Better',
        best: 'Best',
        paintName: 'Paint Name',
        pricePerGallon: 'Price per Gallon',
        coverage: 'Coverage (sqft/gal)',
        materialMarkup: 'Material Markup',
        laborMultiplier: 'Labor Multiplier',
        notes: 'Notes',
      },

      buttons: {
        saveChanges: 'Save Changes',
      },

      help: {
        combinedRule: 'An item is included only if BOTH the room setting AND this filter are enabled',
      },
    },

    clientProposal: {
      title: 'Client Proposal',
      subtitle: 'Ready to send',

      summary: {
        clientName: 'Client Name',
        address: 'Address',
        date: 'Date',
        estimateNumber: 'Estimate #',
      },

      projectDetails: {
        title: 'Project Details',
        floors: 'Floors',
        rooms: 'Rooms',
        coats: 'Coats',
        includedItems: 'Included Items',
      },

      pricing: {
        laborCost: 'Labor Cost',
        materialsCost: 'Materials Cost',
        subtotal: 'Subtotal',
        tax: 'Tax',
        total: 'Total',
        paintOptions: 'Paint Options',
      },

      buttons: {
        copyToClipboard: 'Copy to Clipboard',
        share: 'Share Proposal',
        sendText: 'Send Text Message',
        sendEmail: 'Send Email',
        sendAnother: 'Create Another Quote',
      },

      messages: {
        copiedToClipboard: 'Proposal copied to clipboard',
        shareSubject: 'Paint Estimate for',
      },
    },

    settings: {
      title: 'Settings',

      language: {
        title: 'Language',
        subtitle: 'Choose your preferred language',
        currentLanguage: 'Current Language',
      },

      units: {
        title: 'Measurement System',
        subtitle: 'Choose between metric and imperial units',
        currentSystem: 'Current System',
        imperial: 'Imperial (Feet, Square Feet)',
        metric: 'Metric (Meters, Square Meters)',
      },

      onboarding: {
        title: 'Help & Tutorials',
        viewTutorial: 'View Tutorial Again',
        tutorialSubtitle: 'Learn how to use Paint Pro',
      },

      about: {
        title: 'About',
        version: 'Version',
        feedback: 'Send Feedback',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
      },

      reset: {
        title: 'Reset App',
        resetData: 'Reset All Data',
        resetDataWarning: 'This will delete all projects and settings. This cannot be undone.',
        confirm: 'Are you sure?',
      },
    },

    pricingSettings: {
      title: 'Pricing Settings',
      subtitle: 'Configure labor rates and material prices',

      laborRates: {
        title: 'Labor Rates',
        wallsPerSqft: 'Walls (per sqft)',
        ceilingsPerSqft: 'Ceilings (per sqft)',
        trimPerLinearFoot: 'Trim (per linear foot)',
        baseboardPerLinearFoot: 'Baseboard (per linear foot)',
        doorPerUnit: 'Door (per unit)',
        windowPerUnit: 'Window (per unit)',
      },

      materialPrices: {
        title: 'Material Prices',
        wallPaint: 'Wall Paint (per gallon)',
        ceilingPaint: 'Ceiling Paint (per gallon)',
        trimPaint: 'Trim Paint (per gallon)',
        doorPaint: 'Door Paint (per gallon)',
        primer: 'Primer (per gallon)',
        fiveGalBucketDiscount: '5-Gallon Bucket Discount',
      },

      multipliers: {
        title: 'Multipliers',
        secondCoatLabor: 'Second Coat Labor Multiplier',
        accentWallLabor: 'Accent Wall Labor Multiplier',
      },
    },

    calculationSettings: {
      title: 'Calculation Settings',
      subtitle: 'Configure measurement defaults',

      doorDimensions: {
        title: 'Door Dimensions',
        standardHeight: 'Standard Height',
        standardWidth: 'Standard Width',
        trimWidth: 'Trim Width',
        jambWidth: 'Jamb Width',
      },

      windowDimensions: {
        title: 'Window Dimensions',
        standardHeight: 'Standard Height',
        standardWidth: 'Standard Width',
        trimWidth: 'Trim Width',
      },

      closetDimensions: {
        title: 'Closet Dimensions',
        singleDoorWidth: 'Single-Door Width',
        doubleDoorWidth: 'Double-Door Width',
        trimWidth: 'Trim Width',
        perimeterPercentage: 'Baseboard Perimeter %',
        cavityDepth: 'Cavity Depth',
      },

      trimWidths: {
        title: 'Trim Widths',
        baseboard: 'Baseboard',
        crownMoulding: 'Crown Moulding',
      },

      coverage: {
        title: 'Paint Coverage',
        wallsPerSqft: 'Walls (sqft per gallon)',
        ceilingsPerSqft: 'Ceilings (sqft per gallon)',
        trimPerSqft: 'Trim (sqft per gallon)',
        doorsPerSqft: 'Doors (sqft per gallon)',
        primerPerSqft: 'Primer (sqft per gallon)',
      },
    },
  },

  components: {
    modal: {
      close: 'Close',
    },

    savePrompt: {
      title: 'Save Changes?',
      message: 'You have unsaved changes. Would you like to save them?',
      save: 'Save',
      discard: 'Discard',
      cancel: 'Cancel',
    },

    stepProgressIndicator: {
      step: 'Step',
    },

    tooltip: {
      label: 'More information',
    },

    helperText: {
      info: 'Info',
      warning: 'Warning',
      tip: 'Tip',
    },

    validationMessage: {
      error: 'Error',
      warning: 'Warning',
      success: 'Success',
    },

    onboarding: {
      step1: {
        title: 'Welcome to Paint Pro',
        description: 'Create accurate painting estimates in just 3 steps',
      },
      step2: {
        title: 'Step 1: Setup Your Project',
        description: 'Add client information, define floors, and set paint defaults',
      },
      step3: {
        title: 'Step 2: Build Your Estimate',
        description: 'Add rooms, staircases, fireplaces, and customize your quote',
      },
      step4: {
        title: 'Step 3: Send to Client',
        description: 'Generate a professional proposal and share it with your client',
      },
      getStarted: 'Get Started',
      next: 'Next',
      skip: 'Skip',
    },
  },

  messages: {
    success: {
      saved: 'Saved successfully',
      deleted: 'Deleted successfully',
      copied: 'Copied to clipboard',
      shared: 'Shared successfully',
    },
    error: {
      saveFailed: 'Failed to save. Please try again.',
      deleteFailed: 'Failed to delete. Please try again.',
      loadFailed: 'Failed to load. Please try again.',
      networkError: 'Network error. Please check your connection.',
    },
    confirm: {
      deleteProject: 'Are you sure you want to delete this project?',
      deleteRoom: 'Are you sure you want to delete this room?',
      deleteStaircase: 'Are you sure you want to delete this staircase?',
      deleteFireplace: 'Are you sure you want to delete this fireplace?',
      deleteBuiltIn: 'Are you sure you want to delete this built-in?',
    },
  },
};
