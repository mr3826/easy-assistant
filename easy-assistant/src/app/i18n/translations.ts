export type Locale = 'en' | 'bn';

type TranslationTree = {
  app: {
    title: string;
    name: string;
    description: string;
  };
    common: {
      loading: string;
    loadingSession: string;
    loadingHome: string;
    loadingToday: string;
    loadingAssistant: string;
    loadingBookings: string;
    loadingConversations: string;
    loadingServices: string;
    loadingTeam: string;
    loadingHours: string;
    loadingChannels: string;
    loadingSettings: string;
    loadingPrivacy: string;
    loadingTerms: string;
    refresh: string;
    refreshing: string;
    retry: string;
    signIn: string;
    signUp: string;
    login: string;
    logout: string;
    account: string;
    privacy: string;
    terms: string;
    back: string;
    cancel: string;
    reset: string;
    save: string;
    saving: string;
    connectWhatsApp: string;
    testAssistant: string;
      search: string;
      filter: string;
      select: string;
      allStatuses: string;
      close: string;
    openSidebar: string;
    closeSidebar: string;
    accountMenu: string;
      edit: string;
      delete: string;
      create: string;
    add: string;
    applyToAllDays: string;
    language: string;
    english: string;
    bangla: string;
    to: string;
  };
  nav: {
    home: string;
    bookings: string;
    chats: string;
    services: string;
    team: string;
    hours: string;
    whatsapp: string;
    assistant: string;
    privacy: string;
    terms: string;
    myAccount: string;
  };
  auth: {
    welcomeBack: string;
    signInToApp: string;
    emailAddress: string;
    password: string;
    rememberMe: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    showPassword: string;
    hidePassword: string;
    signingIn: string;
    login: string;
    createYourAccount: string;
    stepOfTwo: string;
    businessInformation: string;
    accountSecurity: string;
    businessName: string;
    businessNamePlaceholder: string;
    ownerName: string;
    ownerNamePlaceholder: string;
    phoneNumber: string;
    businessCategory: string;
    selectCategory: string;
    next: string;
    back: string;
    createAccount: string;
    creatingAccount: string;
    confirmPassword: string;
    passwordMin: string;
    termsConsent: string;
    passwordsDoNotMatch: string;
    validEmail: string;
    passwordRequired: string;
    unableToSignIn: string;
    unableToCreate: string;
    emailExists: string;
    signInPrompt: string;
    signUpPrompt: string;
    categoryDoctor: string;
    categoryHotel: string;
    categorySalon: string;
    categorySpa: string;
    categoryFitness: string;
    categoryRestaurant: string;
    categoryConsulting: string;
    categoryOther: string;
  };
  public: {
    backToApp: string;
    privacyTitle: string;
    privacySubtitle: string;
    privacyBodyOne: string;
    privacyBodyTwo: string;
    privacyBodyThree: string;
    privacyBodyFour: string;
    privacyBodyFive: string;
    privacyBodySix: string;
    privacyFooter: string;
    termsTitle: string;
    termsSubtitle: string;
    termsBodyOne: string;
    termsBodyTwo: string;
    termsBodyThree: string;
    termsBodyFour: string;
    termsBodyFive: string;
    termsFooter: string;
    viewPrivacy: string;
    viewTerms: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    hint: string;
    lastUpdated: string;
    demoData: string;
    refresh: string;
    retry: string;
    goLiveChecklist: string;
    goLiveChecklistDescription: string;
    setupProgress: string;
    connectWhatsApp: string;
    testAssistant: string;
    assistantTitle: string;
    readyToTest: string;
    assistantDescription: string;
    repliesToCustomers: string;
    humanHandoff: string;
    bookingReminders: string;
    checkAssistantReplies: string;
    recentBookings: string;
    recentBookingsDescription: string;
    openBookings: string;
    customer: string;
    service: string;
    staff: string;
    time: string;
    status: string;
    noBookingsYet: string;
    bookings: string;
    customerChats: string;
    missedInquiriesSaved: string;
    newBookingsToday: string;
  };
  appointments: {
    title: string;
    subtitle: string;
    newBooking: string;
    loading: string;
    demoNote: string;
    searchPlaceholder: string;
    filter: string;
    allStatuses: string;
    confirmed: string;
    pending: string;
    cancelled: string;
    completed: string;
    rescheduled: string;
    list: string;
    dayView: string;
    weekView: string;
    monthView: string;
    allBookings: string;
    noMatches: string;
    addManualOrConnect: string;
    weekSoon: string;
    monthSoon: string;
    editBooking: string;
    createBooking: string;
    addDetails: string;
    customer: string;
    service: string;
    staff: string;
    date: string;
    duration: string;
    actions: string;
    noEmail: string;
    unknownCustomer: string;
    unknownService: string;
    unknownStaff: string;
    serviceNotSelected: string;
    unassigned: string;
    statusLabel: string;
    selectStatus: string;
    edit: string;
    cancel: string;
    reschedule: string;
    create: string;
    saveChanges: string;
    saving: string;
    loadSnapshot: string;
    minutes: string;
    noShow: string;
    csvExportPrepared: string;
    pdfExportPrepared: string;
  };
  conversations: {
    title: string;
    subtitle: string;
    assistantInbox: string;
    searchPlaceholder: string;
    loading: string;
    noConversations: string;
    connectWhatsApp: string;
    openWhatsAppSetup: string;
    bookingDetected: string;
    handoffToHuman: string;
    createBooking: string;
    close: string;
    selectConversation: string;
    loadingThread: string;
    noThread: string;
    noMessagesYet: string;
    typeReply: string;
    closedReadOnly: string;
    replyAsHuman: string;
    replyAsAssistant: string;
    sendReply: string;
    channel: string;
    noChannel: string;
    unlinkedChannel: string;
    conversationPrefix: string;
    conversationSuffix: string;
    unknownTime: string;
    selectConversationPrompt: string;
    customer: string;
    assistant: string;
    human: string;
    system: string;
    needsHuman: string;
    closed: string;
    aiReplied: string;
    repliedTo: string;
  };
  services: {
    title: string;
    subtitle: string;
    addService: string;
    loading: string;
    demoNote: string;
    totalServices: string;
    activeServices: string;
    avgDuration: string;
    avgPrice: string;
    allServices: string;
    serviceName: string;
    category: string;
    categoryHair: string;
    categorySkin: string;
    categoryMakeup: string;
    categorySpaWellness: string;
    categoryMassage: string;
    categoryHealthcare: string;
    categoryFitness: string;
    uncategorized: string;
    duration: string;
    price: string;
    staff: string;
    status: string;
    actions: string;
    editService: string;
    addServiceDialog: string;
    createServiceDescription: string;
    editServiceDescription: string;
    serviceNamePlaceholder: string;
    categoryPlaceholder: string;
    description: string;
    priceLabel: string;
    previewTeamLink: string;
    unassigned: string;
    active: string;
    inactive: string;
    saveChanges: string;
    addServiceAction: string;
    saving: string;
    tenantScopeMissing: string;
    serviceNameRequired: string;
    savedThroughApi: string;
    savedLocallyOnly: string;
    deleteConfirm: string;
    deletedThroughApi: string;
    removedLocallyOnly: string;
    liveServicesUnavailable: string;
    apiBackedServiceRecord: string;
    teamAssignmentNote: string;
  };
  staff: {
    title: string;
    subtitle: string;
    addTeamMember: string;
    loading: string;
    demoNote: string;
    teamMembers: string;
    availableNow: string;
    totalBookings: string;
    avgPerMember: string;
    services: string;
    schedule: string;
    edit: string;
    delete: string;
    editTeamMember: string;
    addTeamMemberDialog: string;
    updateMemberDescription: string;
    addMemberDescription: string;
    fullName: string;
    role: string;
    email: string;
    phone: string;
    status: string;
    active: string;
    inactive: string;
    saveChanges: string;
    addMemberAction: string;
    saving: string;
    noEmail: string;
    noPhone: string;
    noServices: string;
    noSchedule: string;
    viewSchedule: string;
    editHours: string;
    scheduleNotConfigured: string;
    memberNameRequired: string;
    teamMember: string;
    memberAdded: string;
    memberUpdated: string;
    savedThroughApi: string;
    savedLocallyOnly: string;
    tenantScopeMissing: string;
    deleteConfirm: string;
    deletedThroughApi: string;
    removedLocallyOnly: string;
    partialLinks: string;
    liveStaffUnavailable: string;
    available: string;
    busy: string;
    selectStatus: string;
  };
  availability: {
    title: string;
    subtitle: string;
    loading: string;
    demoNote: string;
    weeklySchedule: string;
    assistantUsesHours: string;
    applyToAllDays: string;
    saveChanges: string;
    saving: string;
    standardHours: string;
    defaultHours: string;
    hoursSaved: string;
    liveHoursUnavailable: string;
    invalidHour: string;
    signInMissing: string;
    copied: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  channels: {
    title: string;
    subtitle: string;
    loading: string;
    refreshing: string;
    refresh: string;
    number: string;
    lastChecked: string;
    notSyncedYet: string;
    notConnected: string;
    paused: string;
    connected: string;
    needsSetup: string;
    noNumberConnected: string;
    inboxTitle: string;
    inboxDescription: string;
    keepLaunchFocused: string;
    connectWhatsApp: string;
    sendTestMessage: string;
    beforeGoingLive: string;
    beforeGoingLiveDescription: string;
    confirmNumber: string;
    sendTestCustomerMessage: string;
    checkBookingsPage: string;
    handoffCheck: string;
    signInToView: string;
    signInToRefresh: string;
    loadFailed: string;
  };
  assistant: {
    title: string;
    subtitle: string;
    reload: string;
    reset: string;
    status: string;
    ready: string;
    unsaved: string;
    lastSaved: string;
    humanHandoff: string;
    reminders: string;
    testAssistant: string;
    customerMessage: string;
    preview: string;
    previewOnly: string;
    replyStyle: string;
    replyStyleDescription: string;
    assistantName: string;
    tone: string;
    defaultLanguage: string;
    greetingMessage: string;
    bookingRules: string;
    bookingRulesDescription: string;
    autoConfirmBookings: string;
    autoConfirmBookingsDescription: string;
    sendBookingReminders: string;
    sendBookingRemindersDescription: string;
    fallbackAndHandoff: string;
    fallbackAndHandoffDescription: string;
    humanHandoffMessage: string;
    saveAssistant: string;
    friendly: string;
    professional: string;
    formal: string;
    english: string;
    bangla: string;
    englishBangla: string;
    notSavedYet: string;
    savedRepliesLoaded: string;
    defaultRepliesLoaded: string;
    assistantRepliesLoaded: string;
    assistantRepliesSaved: string;
    discardChanges: string;
    typeToPreview: string;
    saveBeforeCustomersSee: string;
    previewPrompt: string;
    signInToSetReplies: string;
    unableToLoad: string;
    unableToSave: string;
  };
  settings: {
    title: string;
    subtitle: string;
    businessDetails: string;
    businessDetailsDescription: string;
    businessName: string;
    location: string;
    phone: string;
    timezone: string;
    city: string;
    address: string;
    signedInAs: string;
    pilotSupport: string;
    pilotSupportDescription: string;
    changeDetails: string;
    passwordChanges: string;
    owner: string;
    notSet: string;
    accountOwner: string;
    noEmailSet: string;
  };
  account: {
    profile: string;
    menu: string;
    logout: string;
  };
  setup: {
    businessDetails: string;
    service: string;
    hours: string;
    teamMember: string;
    connectWhatsApp: string;
    testAssistant: string;
  };
};

export const translations: Record<Locale, TranslationTree> = {
  en: {
    app: {
      title: 'Easy Assistant',
      name: 'Easy Assistant',
      description: 'Manage bookings, customer chats, services, staff, and WhatsApp assistant replies with Easy Assistant.',
    },
    common: {
      loading: 'Loading...',
      loadingSession: 'Checking session...',
      loadingHome: 'Loading home...',
      loadingToday: 'Loading today...',
      loadingAssistant: 'Loading assistant...',
      loadingBookings: 'Loading bookings...',
      loadingConversations: 'Loading customer conversations...',
      loadingServices: 'Loading services...',
      loadingTeam: 'Loading team...',
      loadingHours: 'Loading working hours...',
      loadingChannels: 'Loading WhatsApp setup...',
      loadingSettings: 'Loading account...',
      loadingPrivacy: 'Loading privacy policy...',
      loadingTerms: 'Loading terms...',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      retry: 'Retry',
      signIn: 'Sign in',
      signUp: 'Sign up',
      login: 'Login',
      logout: 'Logout',
      account: 'Account',
      privacy: 'Privacy',
      terms: 'Terms',
      back: 'Back',
      cancel: 'Cancel',
      reset: 'Reset',
      save: 'Save',
      saving: 'Saving...',
      connectWhatsApp: 'Connect WhatsApp',
      testAssistant: 'Test assistant',
      search: 'Search',
      filter: 'Filter',
      select: 'Select',
      allStatuses: 'All statuses',
      close: 'Close',
      openSidebar: 'Open navigation',
      closeSidebar: 'Close navigation',
      accountMenu: 'Open account menu',
      edit: 'Edit',
      delete: 'Delete',
      create: 'Create',
      add: 'Add',
      applyToAllDays: 'Apply to All Days',
      language: 'Language',
      english: 'English',
      bangla: 'Bangla',
      to: 'to',
    },
    nav: {
      home: 'Home',
      bookings: 'Bookings',
      chats: 'Chats',
      services: 'Services',
      team: 'Team',
      hours: 'Hours',
      whatsapp: 'WhatsApp',
      assistant: 'Assistant',
      privacy: 'Privacy',
      terms: 'Terms',
      myAccount: 'My Account',
    },
    auth: {
      welcomeBack: 'Welcome Back',
      signInToApp: 'Sign in to Easy Assistant',
      emailAddress: 'Email Address',
      password: 'Password',
      rememberMe: 'Remember me',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      signingIn: 'Signing in...',
      login: 'Login',
      createYourAccount: 'Create Your Account',
      stepOfTwo: 'Step {step} of 2 - {section}',
      businessInformation: 'Business Information',
      accountSecurity: 'Account Security',
      businessName: 'Business Name',
      businessNamePlaceholder: 'Enter your business name',
      ownerName: 'Owner Name',
      ownerNamePlaceholder: 'Enter your name',
      phoneNumber: 'Phone Number',
      businessCategory: 'Business Category',
      selectCategory: 'Select category',
      next: 'Next',
      back: 'Back',
      createAccount: 'Create Account',
      creatingAccount: 'Creating Account...',
      confirmPassword: 'Confirm Password',
      passwordMin: 'Must be at least 8 characters',
      termsConsent: 'By creating an account, you agree to our Terms of Service and Privacy Policy.',
      passwordsDoNotMatch: 'Passwords do not match.',
      validEmail: 'Please enter a valid email address.',
      passwordRequired: 'Password is required.',
      unableToSignIn: 'Unable to sign in right now.',
      unableToCreate: 'Unable to create your account right now.',
      emailExists: 'An account with this email already exists.',
      signInPrompt: 'Sign in to Easy Assistant',
      signUpPrompt: 'Create your account to continue',
      categoryDoctor: 'Doctor / Medical',
      categoryHotel: 'Hotel / Hospitality',
      categorySalon: 'Salon / Beauty',
      categorySpa: 'Spa / Wellness',
      categoryFitness: 'Fitness / Gym',
      categoryRestaurant: 'Restaurant',
      categoryConsulting: 'Consulting',
      categoryOther: 'Other',
    },
    public: {
      backToApp: 'Back to Easy Assistant',
      privacyTitle: 'Privacy Policy',
      privacySubtitle: 'MVP privacy notice for the Easy Assistant pilot.',
      privacyBodyOne: 'Easy Assistant collects the account, workspace, and operational data needed to run the MVP: name and sign-in details, business profile information, staff and service setup, availability, appointments, conversations, reminders, support requests, and AI configuration.',
      privacyBodyTwo: 'We use that information to authenticate users, display the dashboard, manage bookings, deliver reminders, support WhatsApp conversations, and maintain the service. We do not need more data than that to operate the MVP.',
      privacyBodyThree: 'Customer conversation and booking records should be treated as business-confidential information. Access should stay limited to authorized account holders and service providers that are required to run the product.',
      privacyBodyFour: 'We keep data only as long as it is needed for the account, the booked work, legal obligations, dispute handling, or reasonable operational retention. Backups and logs should follow the same minimum-retention approach in production.',
      privacyBodyFive: 'AI-generated replies and suggestions can be wrong, incomplete, or outdated. Review them before sending them to customers, and do not rely on them for final decisions where human judgment is required.',
      privacyBodySix: 'For privacy questions, deletion requests, or account support, use the in-app support path or contact the workspace owner. Response times during the MVP may be limited.',
      privacyFooter: 'View Terms',
      termsTitle: 'Terms of Service',
      termsSubtitle: 'MVP terms for the Easy Assistant pilot.',
      termsBodyOne: 'Easy Assistant is an AI receptionist workflow for local service businesses. The MVP is designed to validate WhatsApp conversation handling, appointment booking, reminders, dashboard visibility, and business setup flows.',
      termsBodyTwo: 'You are responsible for the accuracy of your business, staff, service, availability, and customer information, and for keeping your account credentials secure. You are also responsible for any activity that happens under your account.',
      termsBodyThree: 'Customer data and conversation history should be handled as confidential. Only share access with people who are authorized to work in the account and who need the data to provide the service.',
      termsBodyFour: 'AI suggestions are support tools, not a guarantee of correctness. Review generated messages before sending them to customers, and do not rely on them as the sole source of truth for scheduling or customer communication.',
      termsBodyFive: 'We may suspend or change the service if security, abuse, legal, or operational issues require it. Support during the MVP is best effort and may be limited to the in-app support path or the workspace owner.',
      termsFooter: 'View Privacy Policy',
      viewPrivacy: 'View Privacy Policy',
      viewTerms: 'View Terms',
    },
    dashboard: {
      title: 'Today',
      subtitle: 'Bookings, customer chats, and WhatsApp setup. Nothing extra.',
      hint: 'Run today\'s bookings from one place.',
      lastUpdated: 'Last updated {time}',
      demoData: 'Showing {business} demo data until real activity is available.',
      refresh: 'Refresh',
      retry: 'Retry',
      goLiveChecklist: 'Go-live checklist',
      goLiveChecklistDescription: 'Only the steps needed before customers can book from WhatsApp.',
      setupProgress: '{completed}/{total} done',
      connectWhatsApp: 'Connect WhatsApp',
      testAssistant: 'Test assistant',
      assistantTitle: 'Assistant',
      readyToTest: 'Ready to test',
      assistantDescription: 'Keep this simple: test replies before giving it to customers.',
      repliesToCustomers: 'Replies to customers',
      humanHandoff: 'Human handoff',
      bookingReminders: 'Booking reminders',
      checkAssistantReplies: 'Check assistant replies',
      recentBookings: 'Recent bookings',
      recentBookingsDescription: 'The latest customers who requested or confirmed a service.',
      openBookings: 'Open bookings',
      customer: 'Customer',
      service: 'Service',
      staff: 'Staff',
      time: 'Time',
      status: 'Status',
      noBookingsYet: 'No bookings yet. Connect WhatsApp or add a booking manually.',
      bookings: 'Bookings',
      customerChats: 'Customer chats',
      missedInquiriesSaved: 'Missed inquiries saved',
      newBookingsToday: 'New bookings today',
    },
    appointments: {
      title: 'Bookings',
      subtitle: 'Create, reschedule, and track every customer booking.',
      newBooking: 'New Booking',
      loading: 'Loading bookings...',
      demoNote: 'Showing Glow Beauty Salon demo bookings until live bookings are available.',
      searchPlaceholder: 'Search by customer, phone, service, or team member',
      filter: 'Filter',
      allStatuses: 'All statuses',
      confirmed: 'Confirmed',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Completed',
      rescheduled: 'Rescheduled',
      list: 'List',
      dayView: 'Day View',
      weekView: 'Week View',
      monthView: 'Month View',
      allBookings: 'All bookings',
      noMatches: 'No bookings match your filters. Add a manual booking or connect WhatsApp to start filling this list.',
      addManualOrConnect: 'No bookings match your filters. Add a manual booking or connect WhatsApp to get started.',
      weekSoon: 'Week view will be available after the booking list is live.',
      monthSoon: 'Month view will be available after the booking list is live.',
      editBooking: 'Edit Booking',
      createBooking: 'Create Booking',
      addDetails: 'Add the customer, service, team member, and time for this booking.',
      customer: 'Customer',
      service: 'Service',
      staff: 'Staff member',
      date: 'Date',
      duration: 'Duration',
      actions: 'Actions',
      noEmail: 'No email',
      unknownCustomer: 'Unknown customer',
      unknownService: 'Unknown service',
      unknownStaff: 'Unknown staff',
      serviceNotSelected: 'Service not selected',
      unassigned: 'Unassigned',
      statusLabel: 'Status',
      selectStatus: 'Select status',
      edit: 'Edit',
      cancel: 'Cancel',
      reschedule: 'Reschedule',
      create: 'Create',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      loadSnapshot: 'Showing the local booking snapshot until the backend CRUD endpoints are available everywhere.',
      minutes: 'min',
      noShow: 'No show',
      csvExportPrepared: 'CSV export is ready.',
      pdfExportPrepared: 'PDF export is ready.',
    },
    conversations: {
      title: 'Customer Conversations',
      subtitle: 'Review customer inquiries, assistant replies, and hand off when a person should step in.',
      assistantInbox: 'Assistant Inbox',
      searchPlaceholder: 'Search customer conversations',
      loading: 'Loading customer conversations...',
      noConversations: 'No customer conversations yet.',
      connectWhatsApp: 'Connect WhatsApp',
      openWhatsAppSetup: 'Open WhatsApp setup to connect the customer inbox.',
      bookingDetected: 'Booking detected',
      handoffToHuman: 'Handoff to Human',
      createBooking: 'Create Booking',
      close: 'Close',
      selectConversation: 'Select a conversation to view the customer thread.',
      loadingThread: 'Loading customer thread...',
      noThread: 'The selected thread could not be loaded.',
      noMessagesYet: 'No messages yet. When a customer writes from WhatsApp, the full thread will appear here.',
      typeReply: 'Type a customer reply...',
      closedReadOnly: 'This conversation is closed.',
      replyAsHuman: 'Replying as human.',
      replyAsAssistant: 'Replying as human after assistant handoff.',
      sendReply: 'Send Reply',
      channel: 'Channel',
      noChannel: 'No channel',
      unlinkedChannel: 'Unlinked channel',
      conversationPrefix: 'Conversation',
      conversationSuffix: 'conversation',
      unknownTime: 'Unknown time',
      selectConversationPrompt: 'Select a conversation first.',
      customer: 'Customer',
      assistant: 'Easy Assistant',
      human: 'Human',
      system: 'System',
      needsHuman: 'Needs human',
      closed: 'Closed',
      aiReplied: 'AI replied',
      repliedTo: 'Reply sent.',
    },
    services: {
      title: 'Services',
      subtitle: 'Add the services customers can book with your assistant.',
      addService: 'Add Service',
      loading: 'Loading services...',
      demoNote: 'Showing Glow Beauty Salon service examples until live services are available.',
      totalServices: 'Total services',
      activeServices: 'Active services',
      avgDuration: 'Avg. duration',
      avgPrice: 'Avg. price',
      allServices: 'All services',
      serviceName: 'Service name',
      category: 'Category',
      categoryHair: 'Hair Services',
      categorySkin: 'Skin Care',
      categoryMakeup: 'Makeup',
      categorySpaWellness: 'Spa & Wellness',
      categoryMassage: 'Massage',
      categoryHealthcare: 'Healthcare',
      categoryFitness: 'Fitness',
      uncategorized: 'Uncategorized',
      duration: 'Duration',
      price: 'Price',
      staff: 'Staff',
      status: 'Status',
      actions: 'Actions',
      editService: 'Edit Service',
      addServiceDialog: 'Add Service',
      createServiceDescription: 'Create a service customers can ask for on WhatsApp.',
      editServiceDescription: 'Update the service customers can book.',
      serviceNamePlaceholder: 'e.g., Haircut, Facial',
      categoryPlaceholder: 'Select category',
      description: 'Description',
      priceLabel: 'Price (BDT)',
      previewTeamLink: 'Preview team link',
      unassigned: 'Unassigned',
      active: 'Active',
      inactive: 'Inactive',
      saveChanges: 'Save Changes',
      addServiceAction: 'Add Service',
      saving: 'Saving...',
      tenantScopeMissing: 'Sign in first so this location can be saved.',
      serviceNameRequired: 'Service name is required.',
      savedThroughApi: 'Service saved.',
      savedLocallyOnly: 'Saved locally only.',
      deleteConfirm: 'Delete {name}? This cannot be undone.',
      deletedThroughApi: 'Deleted {name}.',
      removedLocallyOnly: 'Removed {name} locally.',
      liveServicesUnavailable: 'Could not load live services. Showing demo data for now.',
      apiBackedServiceRecord: 'This service record is backed by the API.',
      teamAssignmentNote: 'Team assignment is just for preview until the live team data is connected.',
    },
    staff: {
      title: 'Team',
      subtitle: 'Manage the people customers can book with.',
      addTeamMember: 'Add Team Member',
      loading: 'Loading team...',
      demoNote: 'Showing Glow Beauty Salon team examples until live team records are available.',
      teamMembers: 'Team members',
      availableNow: 'Available Now',
      totalBookings: 'Total Bookings',
      avgPerMember: 'Avg. per member',
      services: 'Services',
      schedule: 'Schedule',
      edit: 'Edit',
      delete: 'Delete',
      editTeamMember: 'Edit Team Member',
      addTeamMemberDialog: 'Add Team Member',
      updateMemberDescription: 'Update this team member.',
      addMemberDescription: 'Add a team member customers can book with.',
      fullName: 'Full name',
      role: 'Role',
      email: 'Email',
      phone: 'Phone',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
      saveChanges: 'Save Changes',
      addMemberAction: 'Add Team Member',
      saving: 'Saving...',
      noEmail: 'No email on file',
      noPhone: 'No phone on file',
      noServices: 'No services assigned yet',
      noSchedule: 'Schedule not configured',
      viewSchedule: 'View Schedule',
      editHours: 'Edit Hours',
      scheduleNotConfigured: 'Schedule not configured',
      memberNameRequired: 'Member name is required.',
      teamMember: 'Team Member',
      memberAdded: 'Team member added.',
      memberUpdated: 'Team member updated.',
      savedThroughApi: 'Team member saved.',
      savedLocallyOnly: 'Saved locally only.',
      tenantScopeMissing: 'Sign in first so this location can be saved.',
      deleteConfirm: 'Delete {name}? This cannot be undone.',
      deletedThroughApi: 'Deleted {name}.',
      removedLocallyOnly: 'Removed {name} locally.',
      partialLinks: 'Showing team data. Some linked records are still loading.',
      liveStaffUnavailable: 'Could not load live team records. Showing demo data for now.',
      available: 'Available',
      busy: 'Busy',
      selectStatus: 'Select status',
    },
    availability: {
      title: 'Working Hours',
      subtitle: 'Set when customers can book appointments with your business.',
      loading: 'Loading working hours...',
      demoNote: 'Showing default salon hours until live working hours are available.',
      weeklySchedule: 'Weekly schedule',
      assistantUsesHours: 'The assistant uses these hours when offering booking times.',
      applyToAllDays: 'Apply to All Days',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      standardHours: 'Showing standard salon hours until saved working hours are available.',
      defaultHours: 'Showing default salon hours until live working hours are available.',
      hoursSaved: 'Working hours saved for this location.',
      liveHoursUnavailable: 'Could not save working hours to the live account. Your changes remain on this screen for review.',
      invalidHour: '{day} closing time must be after opening time.',
      signInMissing: 'Sign in context is missing tenant scope, so working hours cannot be saved yet.',
      copied: 'Copied these hours to every working day.',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
    channels: {
      title: 'WhatsApp',
      subtitle: 'Start with the one channel most customers in Bangladesh already use.',
      loading: 'Loading WhatsApp setup...',
      refreshing: 'Refreshing...',
      refresh: 'Refresh',
      number: 'Number',
      lastChecked: 'Last checked',
      notSyncedYet: 'Not synced yet',
      notConnected: 'Not connected',
      paused: 'Paused',
      connected: 'Connected',
      needsSetup: 'Needs setup',
      noNumberConnected: 'No WhatsApp number connected',
      inboxTitle: 'WhatsApp booking inbox',
      inboxDescription: 'Customers message this number. Easy Assistant can reply, collect details, and help book a time.',
      keepLaunchFocused: 'Keep launch focused here. Add other customer channels only after WhatsApp bookings work reliably.',
      connectWhatsApp: 'Connect WhatsApp',
      sendTestMessage: 'Send test message',
      beforeGoingLive: 'Before going live',
      beforeGoingLiveDescription: 'Do these with the business owner, not alone in a settings screen.',
      confirmNumber: 'Confirm the business WhatsApp number.',
      sendTestCustomerMessage: 'Send one customer-style test message.',
      checkBookingsPage: 'Make sure bookings appear in the Bookings page.',
      handoffCheck: 'Make sure a human can take over a chat.',
      signInToView: 'Sign in to view WhatsApp setup.',
      signInToRefresh: 'Sign in to refresh WhatsApp setup',
      loadFailed: 'We could not load WhatsApp setup. Please try again.',
    },
    assistant: {
      title: 'Assistant',
      subtitle: 'Control how your receptionist replies, books, and hands off safely.',
      reload: 'Reload',
      reset: 'Reset',
      status: 'Status',
      ready: 'Ready',
      unsaved: 'Unsaved changes',
      lastSaved: 'Last saved',
      humanHandoff: 'Human handoff',
      reminders: 'Reminders',
      testAssistant: 'Test Assistant',
      customerMessage: 'Customer message',
      preview: 'Assistant preview',
      previewOnly: 'Preview only. Save changes before customers see them.',
      replyStyle: 'Reply style',
      replyStyleDescription: 'Set how your receptionist greets customers and answers common requests.',
      assistantName: 'Assistant name',
      tone: 'Tone of reply',
      defaultLanguage: 'Default language',
      greetingMessage: 'Greeting message',
      bookingRules: 'Booking rules',
      bookingRulesDescription: 'Decide when the assistant can confirm bookings and send reminders.',
      autoConfirmBookings: 'Auto-confirm bookings',
      autoConfirmBookingsDescription: 'Confirm bookings automatically when the slot is valid.',
      sendBookingReminders: 'Send booking reminders',
      sendBookingRemindersDescription: 'Remind customers before confirmed bookings.',
      fallbackAndHandoff: 'Fallback and handoff',
      fallbackAndHandoffDescription: 'Control what customers see when a person should take over.',
      humanHandoffMessage: 'Human handoff message',
      saveAssistant: 'Save assistant',
      friendly: 'Friendly',
      professional: 'Professional',
      formal: 'Formal',
      english: 'English',
      bangla: 'Bangla',
      englishBangla: 'English and Bangla',
      notSavedYet: 'Not saved yet',
      savedRepliesLoaded: 'Assistant replies loaded.',
      defaultRepliesLoaded: 'Default assistant replies loaded.',
      assistantRepliesLoaded: 'Assistant replies loaded.',
      assistantRepliesSaved: 'Assistant replies saved.',
      discardChanges: 'Discard unsaved changes',
      typeToPreview: 'Type a customer message to preview the assistant reply.',
      saveBeforeCustomersSee: 'Save changes before customers see them.',
      previewPrompt: 'Preview a customer reply before your receptionist goes live.',
      signInToSetReplies: 'Sign in to set assistant replies.',
      unableToLoad: 'Unable to load assistant replies.',
      unableToSave: 'Unable to save assistant replies.',
    },
    settings: {
      title: 'Account',
      subtitle: 'The few account details a pilot business actually needs to confirm.',
      businessDetails: 'Business details',
      businessDetailsDescription: 'These details are used for bookings, hours, and customer replies.',
      businessName: 'Business name',
      location: 'Location',
      phone: 'Phone',
      timezone: 'Timezone',
      city: 'City',
      address: 'Address',
      signedInAs: 'Signed in as',
      pilotSupport: 'Pilot support',
      pilotSupportDescription: 'Keep account changes assisted until the product is stable.',
      changeDetails: 'Change business details during onboarding or with support.',
      passwordChanges: 'Password and advanced account changes are handled with support during the pilot.',
      owner: 'Owner',
      notSet: 'Not set',
      accountOwner: 'Account owner',
      noEmailSet: 'No email set',
    },
    account: {
      profile: 'Account',
      menu: 'My Account',
      logout: 'Logout',
    },
    setup: {
      businessDetails: 'Add your business details',
      service: 'Add at least one service',
      hours: 'Add working hours',
      teamMember: 'Add one team member',
      connectWhatsApp: 'Connect WhatsApp',
      testAssistant: 'Test your assistant',
    },
  },
  bn: {
    app: {
      title: 'ইজি অ্যাসিস্ট্যান্ট',
      name: 'ইজি অ্যাসিস্ট্যান্ট',
      description: 'ইজি অ্যাসিস্ট্যান্ট দিয়ে বুকিং, গ্রাহক চ্যাট, সার্ভিস, টিম, আর WhatsApp assistant reply ম্যানেজ করুন।',
    },
    common: {
      loading: 'লোড হচ্ছে...',
      loadingSession: 'সেশন যাচাই করা হচ্ছে...',
      loadingHome: 'হোম লোড হচ্ছে...',
      loadingToday: 'আজকের তথ্য লোড হচ্ছে...',
      loadingAssistant: 'অ্যাসিস্ট্যান্ট লোড হচ্ছে...',
      loadingBookings: 'বুকিং লোড হচ্ছে...',
      loadingConversations: 'গ্রাহক কথোপকথন লোড হচ্ছে...',
      loadingServices: 'সার্ভিস লোড হচ্ছে...',
      loadingTeam: 'টিম লোড হচ্ছে...',
      loadingHours: 'কাজের সময় লোড হচ্ছে...',
      loadingChannels: 'WhatsApp সেটআপ লোড হচ্ছে...',
      loadingSettings: 'অ্যাকাউন্ট লোড হচ্ছে...',
      loadingPrivacy: 'গোপনীয়তা নীতি লোড হচ্ছে...',
      loadingTerms: 'শর্তাবলি লোড হচ্ছে...',
      refresh: 'রিফ্রেশ',
      refreshing: 'রিফ্রেশ হচ্ছে...',
      retry: 'আবার চেষ্টা করুন',
      signIn: 'সাইন ইন',
      signUp: 'সাইন আপ',
      login: 'লগইন',
      logout: 'লগআউট',
      account: 'অ্যাকাউন্ট',
      privacy: 'গোপনীয়তা',
      terms: 'শর্তাবলি',
      back: 'ফিরে যান',
      cancel: 'বাতিল',
      reset: 'রিসেট',
      save: 'সেভ',
      saving: 'সেভ হচ্ছে...',
      connectWhatsApp: 'WhatsApp কানেক্ট করুন',
      testAssistant: 'অ্যাসিস্ট্যান্ট টেস্ট করুন',
      search: 'খুঁজুন',
      filter: 'ফিল্টার',
      select: 'নির্বাচন করুন',
      allStatuses: 'সব স্ট্যাটাস',
      close: 'বন্ধ করুন',
      openSidebar: 'নেভিগেশন খুলুন',
      closeSidebar: 'নেভিগেশন বন্ধ করুন',
      accountMenu: 'অ্যাকাউন্ট মেনু খুলুন',
      edit: 'এডিট',
      delete: 'মুছুন',
      create: 'তৈরি করুন',
      add: 'যোগ করুন',
      applyToAllDays: 'সব দিনে প্রয়োগ করুন',
      language: 'ভাষা',
      english: 'ইংরেজি',
      bangla: 'বাংলা',
      to: 'থেকে',
    },
    nav: {
      home: 'হোম',
      bookings: 'বুকিং',
      chats: 'চ্যাট',
      services: 'সার্ভিস',
      team: 'টিম',
      hours: 'সময়সূচি',
      whatsapp: 'WhatsApp',
      assistant: 'অ্যাসিস্ট্যান্ট',
      privacy: 'গোপনীয়তা',
      terms: 'শর্তাবলি',
      myAccount: 'আমার অ্যাকাউন্ট',
    },
    auth: {
      welcomeBack: 'ফিরে আসায় স্বাগতম',
      signInToApp: 'ইজি অ্যাসিস্ট্যান্টে সাইন ইন করুন',
      emailAddress: 'ইমেইল ঠিকানা',
      password: 'পাসওয়ার্ড',
      rememberMe: 'মনে রাখুন',
      dontHaveAccount: 'অ্যাকাউন্ট নেই?',
      alreadyHaveAccount: 'আগেই অ্যাকাউন্ট আছে?',
      showPassword: 'পাসওয়ার্ড দেখান',
      hidePassword: 'পাসওয়ার্ড লুকান',
      signingIn: 'সাইন ইন করা হচ্ছে...',
      login: 'লগইন',
      createYourAccount: 'আপনার অ্যাকাউন্ট তৈরি করুন',
      stepOfTwo: 'ধাপ {step} / 2 - {section}',
      businessInformation: 'ব্যবসার তথ্য',
      accountSecurity: 'অ্যাকাউন্ট সুরক্ষা',
      businessName: 'ব্যবসার নাম',
      businessNamePlaceholder: 'আপনার ব্যবসার নাম লিখুন',
      ownerName: 'মালিকের নাম',
      ownerNamePlaceholder: 'আপনার নাম লিখুন',
      phoneNumber: 'ফোন নম্বর',
      businessCategory: 'ব্যবসার ধরন',
      selectCategory: 'ধরন নির্বাচন করুন',
      next: 'পরবর্তী',
      back: 'পেছনে',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন',
      creatingAccount: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
      confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
      passwordMin: 'কমপক্ষে ৮ অক্ষর হতে হবে',
      termsConsent: 'অ্যাকাউন্ট তৈরি করলে আপনি আমাদের শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিচ্ছেন।',
      passwordsDoNotMatch: 'পাসওয়ার্ড মিলছে না।',
      validEmail: 'দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন।',
      passwordRequired: 'পাসওয়ার্ড প্রয়োজন।',
      unableToSignIn: 'এখনই সাইন ইন করা যাচ্ছে না।',
      unableToCreate: 'এখনই অ্যাকাউন্ট তৈরি করা যাচ্ছে না।',
      emailExists: 'এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে।',
      signInPrompt: 'ইজি অ্যাসিস্ট্যান্টে সাইন ইন করুন',
      signUpPrompt: 'চালিয়ে যেতে অ্যাকাউন্ট তৈরি করুন',
      categoryDoctor: 'ডাক্তার / মেডিকেল',
      categoryHotel: 'হোটেল / হসপিটালিটি',
      categorySalon: 'সেলুন / বিউটি',
      categorySpa: 'স্পা / ওয়েলনেস',
      categoryFitness: 'ফিটনেস / জিম',
      categoryRestaurant: 'রেস্টুরেন্ট',
      categoryConsulting: 'কনসাল্টিং',
      categoryOther: 'অন্যান্য',
    },
    public: {
      backToApp: 'ইজি অ্যাসিস্ট্যান্টে ফিরে যান',
      privacyTitle: 'গোপনীয়তা নীতি',
      privacySubtitle: 'ইজি অ্যাসিস্ট্যান্ট পাইলটের MVP গোপনীয়তা নোটিশ।',
      privacyBodyOne: 'ইজি অ্যাসিস্ট্যান্ট MVP চালাতে প্রয়োজনীয় অ্যাকাউন্ট, ওয়ার্কস্পেস এবং অপারেশনাল তথ্য সংগ্রহ করে: নাম ও সাইন-ইন তথ্য, ব্যবসার প্রোফাইল, স্টাফ ও সার্ভিস সেটআপ, কাজের সময়, অ্যাপয়েন্টমেন্ট, কথোপকথন, রিমাইন্ডার, সাপোর্ট রিকোয়েস্ট, এবং AI কনফিগারেশন।',
      privacyBodyTwo: 'আমরা এই তথ্য ব্যবহার করি ব্যবহারকারী যাচাই, ড্যাশবোর্ড দেখানো, বুকিং ম্যানেজ, রিমাইন্ডার পাঠানো, WhatsApp কথোপকথন সাপোর্ট করা, এবং সার্ভিস চালু রাখতে। MVP চালাতে এর বেশি ডেটা দরকার নেই।',
      privacyBodyThree: 'গ্রাহকের কথোপকথন ও বুকিং রেকর্ডকে ব্যবসায়িক গোপন তথ্য হিসেবে ধরতে হবে। অ্যাক্সেস শুধু অনুমোদিত অ্যাকাউন্ট হোল্ডার এবং সার্ভিস প্রোভাইডারদের মধ্যে সীমিত থাকা উচিত।',
      privacyBodyFour: 'অ্যাকাউন্ট, বুক করা কাজ, আইনি বাধ্যবাধকতা, বিরোধ নিষ্পত্তি, বা যুক্তিসঙ্গত অপারেশনাল রিটেনশনের জন্য যতদিন দরকার ততদিনই ডেটা রাখা হবে। প্রোডাকশনে ব্যাকআপ ও লগও একই ন্যূনতম রিটেনশন নীতি অনুসরণ করবে।',
      privacyBodyFive: 'AI-generated reply আর suggestion ভুল, অসম্পূর্ণ, বা পুরোনো হতে পারে। গ্রাহকের কাছে পাঠানোর আগে সেগুলো যাচাই করুন, এবং যেখানে মানুষের সিদ্ধান্ত দরকার সেখানে এগুলোর ওপর নির্ভর করবেন না।',
      privacyBodySix: 'গোপনীয়তা প্রশ্ন, ডিলিট রিকোয়েস্ট, বা অ্যাকাউন্ট সাপোর্টের জন্য অ্যাপের সাপোর্ট পথ ব্যবহার করুন অথবা ওয়ার্কস্পেস মালিকের সাথে যোগাযোগ করুন। MVP চলাকালে সাড়া দেওয়ার সময় সীমিত হতে পারে।',
      privacyFooter: 'শর্তাবলি দেখুন',
      termsTitle: 'শর্তাবলি',
      termsSubtitle: 'ইজি অ্যাসিস্ট্যান্ট পাইলটের MVP শর্তাবলি।',
      termsBodyOne: 'ইজি অ্যাসিস্ট্যান্ট স্থানীয় সার্ভিস ব্যবসার জন্য একটি AI receptionist workflow। MVP-এর লক্ষ্য WhatsApp কথোপকথন, অ্যাপয়েন্টমেন্ট বুকিং, রিমাইন্ডার, ড্যাশবোর্ড, এবং ব্যবসা সেটআপ ফ্লো যাচাই করা।',
      termsBodyTwo: 'আপনার ব্যবসা, স্টাফ, সার্ভিস, কাজের সময়, এবং গ্রাহকের তথ্য সঠিক রাখার দায়িত্ব আপনার, আর অ্যাকাউন্টের তথ্য সুরক্ষিত রাখার দায়িত্বও আপনার। আপনার অ্যাকাউন্টে যা ঘটে তার দায়ও আপনার।',
      termsBodyThree: 'গ্রাহকের ডেটা এবং কথোপকথন ইতিহাসকে গোপন হিসেবে ধরতে হবে। যাদের অ্যাকাউন্টে কাজ করার অনুমতি আছে এবং যাদের সেই ডেটা দরকার, শুধু তাদেরই অ্যাক্সেস দিন।',
      termsBodyFour: 'AI suggestion সহায়ক টুল, সঠিকতার নিশ্চয়তা নয়। গ্রাহকের কাছে পাঠানোর আগে generated message যাচাই করুন, এবং সময় নির্ধারণ বা যোগাযোগের একমাত্র উৎস হিসেবে এগুলোর ওপর নির্ভর করবেন না।',
      termsBodyFive: 'নিরাপত্তা, অপব্যবহার, আইনি, বা অপারেশনাল কারণে প্রয়োজন হলে আমরা সার্ভিস স্থগিত বা পরিবর্তন করতে পারি। MVP চলাকালে সাপোর্ট best effort ভিত্তিতে হবে এবং অ্যাপের সাপোর্ট পথ বা ওয়ার্কস্পেস মালিক পর্যন্ত সীমিত থাকতে পারে।',
      termsFooter: 'গোপনীয়তা নীতি দেখুন',
      viewPrivacy: 'গোপনীয়তা নীতি দেখুন',
      viewTerms: 'শর্তাবলি দেখুন',
    },
    dashboard: {
      title: 'আজ',
      subtitle: 'বুকিং, গ্রাহক চ্যাট, আর WhatsApp সেটআপ। এর বাইরে কিছু না।',
      hint: 'আজকের বুকিংগুলো এক জায়গা থেকে চালান।',
      lastUpdated: 'শেষ আপডেট {time}',
      demoData: 'আসল কার্যক্রম না আসা পর্যন্ত {business} ডেমো ডেটা দেখানো হচ্ছে।',
      refresh: 'রিফ্রেশ',
      retry: 'আবার চেষ্টা করুন',
      goLiveChecklist: 'লাইভে যাওয়ার চেকলিস্ট',
      goLiveChecklistDescription: 'গ্রাহকরা WhatsApp থেকে বুক করার আগে শুধু এই ধাপগুলোই দরকার।',
      setupProgress: '{completed}/{total} সম্পন্ন',
      connectWhatsApp: 'WhatsApp কানেক্ট করুন',
      testAssistant: 'অ্যাসিস্ট্যান্ট টেস্ট করুন',
      assistantTitle: 'অ্যাসিস্ট্যান্ট',
      readyToTest: 'টেস্ট করার জন্য প্রস্তুত',
      assistantDescription: 'সহজ রাখুন: গ্রাহকের কাছে দেওয়ার আগে reply টেস্ট করুন।',
      repliesToCustomers: 'গ্রাহককে reply',
      humanHandoff: 'মানুষের কাছে হ্যান্ডঅফ',
      bookingReminders: 'বুকিং রিমাইন্ডার',
      checkAssistantReplies: 'অ্যাসিস্ট্যান্টের reply দেখুন',
      recentBookings: 'সাম্প্রতিক বুকিং',
      recentBookingsDescription: 'সর্বশেষ যে গ্রাহকরা সার্ভিস চেয়েছেন বা নিশ্চিত করেছেন।',
      openBookings: 'বুকিং খুলুন',
      customer: 'গ্রাহক',
      service: 'সার্ভিস',
      staff: 'স্টাফ',
      time: 'সময়',
      status: 'স্ট্যাটাস',
      noBookingsYet: 'এখনও কোনো বুকিং নেই। WhatsApp কানেক্ট করুন বা হাতে একটি বুকিং যোগ করুন।',
      bookings: 'বুকিং',
      customerChats: 'গ্রাহক চ্যাট',
      missedInquiriesSaved: 'মিস হওয়া জিজ্ঞাসা বাঁচানো হয়েছে',
      newBookingsToday: 'আজকের নতুন বুকিং',
    },
    appointments: {
      title: 'বুকিং',
      subtitle: 'প্রতিটি গ্রাহক বুকিং তৈরি, পুনঃনির্ধারণ, এবং ট্র্যাক করুন।',
      newBooking: 'নতুন বুকিং',
      loading: 'বুকিং লোড হচ্ছে...',
      demoNote: 'লাইভ বুকিং পাওয়া না গেলে Glow Beauty Salon ডেমো বুকিং দেখানো হচ্ছে।',
      searchPlaceholder: 'গ্রাহক, ফোন, সার্ভিস, বা টিম মেম্বার দিয়ে খুঁজুন',
      filter: 'ফিল্টার',
      allStatuses: 'সব স্ট্যাটাস',
      confirmed: 'নিশ্চিত',
      pending: 'অপেক্ষমাণ',
      cancelled: 'বাতিল',
      completed: 'সম্পন্ন',
      rescheduled: 'পুনঃনির্ধারিত',
      list: 'তালিকা',
      dayView: 'দিনভিত্তিক',
      weekView: 'সপ্তাহভিত্তিক',
      monthView: 'মাসভিত্তিক',
      allBookings: 'সব বুকিং',
      noMatches: 'আপনার ফিল্টারে কোনো বুকিং নেই। একটি ম্যানুয়াল বুকিং যোগ করুন বা শুরু করতে WhatsApp কানেক্ট করুন।',
      addManualOrConnect: 'আপনার ফিল্টারে কোনো বুকিং নেই। একটি ম্যানুয়াল বুকিং যোগ করুন বা WhatsApp কানেক্ট করুন।',
      weekSoon: 'বুকিং তালিকা লাইভ হলে সপ্তাহভিত্তিক ভিউ পাওয়া যাবে।',
      monthSoon: 'বুকিং তালিকা লাইভ হলে মাসভিত্তিক ভিউ পাওয়া যাবে।',
      editBooking: 'বুকিং এডিট করুন',
      createBooking: 'বুকিং তৈরি করুন',
      addDetails: 'এই বুকিংয়ের জন্য গ্রাহক, সার্ভিস, টিম মেম্বার, এবং সময় যোগ করুন।',
      customer: 'গ্রাহক',
      service: 'সার্ভিস',
      staff: 'স্টাফ সদস্য',
      date: 'তারিখ',
      duration: 'সময়কাল',
      actions: 'অ্যাকশন',
      noEmail: 'ইমেইল নেই',
      unknownCustomer: 'অজানা গ্রাহক',
      unknownService: 'অজানা সার্ভিস',
      unknownStaff: 'অজানা স্টাফ',
      serviceNotSelected: 'সার্ভিস নির্বাচিত নয়',
      unassigned: 'নির্ধারিত নয়',
      statusLabel: 'স্ট্যাটাস',
      selectStatus: 'স্ট্যাটাস নির্বাচন করুন',
      edit: 'এডিট',
      cancel: 'বাতিল',
      reschedule: 'পুনঃনির্ধারণ',
      create: 'তৈরি করুন',
      saveChanges: 'পরিবর্তন সেভ করুন',
      saving: 'সেভ হচ্ছে...',
      loadSnapshot: 'ব্যাকএন্ড CRUD endpoint সবখানে না আসা পর্যন্ত লোকাল বুকিং স্ন্যাপশট দেখানো হচ্ছে।',
      minutes: 'মিনিট',
      noShow: 'না এসেছেন',
      csvExportPrepared: 'CSV এক্সপোর্ট প্রস্তুত।',
      pdfExportPrepared: 'PDF এক্সপোর্ট প্রস্তুত।',
    },
    conversations: {
      title: 'গ্রাহক কথোপকথন',
      subtitle: 'গ্রাহকের প্রশ্ন দেখুন, assistant reply দেখুন, আর মানুষ দরকার হলে হ্যান্ডঅফ করুন।',
      assistantInbox: 'অ্যাসিস্ট্যান্ট ইনবক্স',
      searchPlaceholder: 'গ্রাহকের কথোপকথন খুঁজুন',
      loading: 'গ্রাহক কথোপকথন লোড হচ্ছে...',
      noConversations: 'এখনও কোনো গ্রাহক কথোপকথন নেই।',
      connectWhatsApp: 'WhatsApp কানেক্ট করুন',
      openWhatsAppSetup: 'গ্রাহক ইনবক্স কানেক্ট করতে WhatsApp সেটআপ খুলুন।',
      bookingDetected: 'বুকিং সনাক্ত',
      handoffToHuman: 'মানুষের কাছে হ্যান্ডঅফ',
      createBooking: 'বুকিং তৈরি করুন',
      close: 'বন্ধ করুন',
      selectConversation: 'গ্রাহকের থ্রেড দেখতে একটি কথোপকথন নির্বাচন করুন।',
      loadingThread: 'গ্রাহক থ্রেড লোড হচ্ছে...',
      noThread: 'নির্বাচিত থ্রেড লোড করা যায়নি।',
      noMessagesYet: 'এখনও কোনো মেসেজ নেই। গ্রাহক WhatsApp থেকে লিখলে সম্পূর্ণ থ্রেড এখানে দেখাবে।',
      typeReply: 'গ্রাহকের reply লিখুন...',
      closedReadOnly: 'এই কথোপকথন বন্ধ।',
      replyAsHuman: 'মানুষ হিসেবে reply দিচ্ছেন।',
      replyAsAssistant: 'অ্যাসিস্ট্যান্টের হ্যান্ডঅফের পর মানুষ হিসেবে reply দিচ্ছেন।',
      sendReply: 'Reply পাঠান',
      channel: 'চ্যানেল',
      noChannel: 'কোনো চ্যানেল নেই',
      unlinkedChannel: 'অনির্ধারিত চ্যানেল',
      conversationPrefix: 'কথোপকথন',
      conversationSuffix: 'কথোপকথন',
      unknownTime: 'অজানা সময়',
      selectConversationPrompt: 'আগে একটি কথোপকথন নির্বাচন করুন।',
      customer: 'গ্রাহক',
      assistant: 'ইজি অ্যাসিস্ট্যান্ট',
      human: 'মানুষ',
      system: 'সিস্টেম',
      needsHuman: 'মানুষ দরকার',
      closed: 'বন্ধ',
      aiReplied: 'AI reply দিয়েছে',
      repliedTo: 'Reply পাঠানো হয়েছে।',
    },
    services: {
      title: 'সার্ভিস',
      subtitle: 'গ্রাহকরা assistant-এর মাধ্যমে যে সার্ভিস বুক করতে পারে তা যোগ করুন।',
      addService: 'সার্ভিস যোগ করুন',
      loading: 'সার্ভিস লোড হচ্ছে...',
      demoNote: 'লাইভ সার্ভিস পাওয়া না গেলে Glow Beauty Salon সার্ভিস উদাহরণ দেখানো হচ্ছে।',
      totalServices: 'মোট সার্ভিস',
      activeServices: 'সক্রিয় সার্ভিস',
      avgDuration: 'গড় সময়',
      avgPrice: 'গড় মূল্য',
      allServices: 'সব সার্ভিস',
      serviceName: 'সার্ভিসের নাম',
      category: 'ধরন',
      categoryHair: 'চুলের সার্ভিস',
      categorySkin: 'ত্বকের যত্ন',
      categoryMakeup: 'মেকআপ',
      categorySpaWellness: 'স্পা ও ওয়েলনেস',
      categoryMassage: 'ম্যাসাজ',
      categoryHealthcare: 'স্বাস্থ্যসেবা',
      categoryFitness: 'ফিটনেস',
      uncategorized: 'ধরন নেই',
      duration: 'সময়কাল',
      price: 'মূল্য',
      staff: 'স্টাফ',
      status: 'স্ট্যাটাস',
      actions: 'অ্যাকশন',
      editService: 'সার্ভিস এডিট করুন',
      addServiceDialog: 'সার্ভিস যোগ করুন',
      createServiceDescription: 'গ্রাহকরা WhatsApp-এ যা চাইতে পারে এমন একটি সার্ভিস তৈরি করুন।',
      editServiceDescription: 'গ্রাহকরা যে সার্ভিস বুক করতে পারে তা আপডেট করুন।',
      serviceNamePlaceholder: 'যেমন, Haircut, Facial',
      categoryPlaceholder: 'ধরন নির্বাচন করুন',
      description: 'বিবরণ',
      priceLabel: 'মূল্য (BDT)',
      previewTeamLink: 'টিম লিংক প্রিভিউ',
      unassigned: 'নির্ধারিত নয়',
      active: 'সক্রিয়',
      inactive: 'নিষ্ক্রিয়',
      saveChanges: 'পরিবর্তন সেভ করুন',
      addServiceAction: 'সার্ভিস যোগ করুন',
      saving: 'সেভ হচ্ছে...',
      tenantScopeMissing: 'এই লোকেশন সেভ করতে আগে সাইন ইন করুন।',
      serviceNameRequired: 'সার্ভিসের নাম প্রয়োজন।',
      savedThroughApi: 'সার্ভিস সেভ হয়েছে।',
      savedLocallyOnly: 'শুধু লোকালি সেভ হয়েছে।',
      deleteConfirm: '{name} মুছবেন? এটা আর ফেরত আনা যাবে না।',
      deletedThroughApi: '{name} মুছে ফেলা হয়েছে।',
      removedLocallyOnly: '{name} লোকালি মুছে ফেলা হয়েছে।',
      liveServicesUnavailable: 'লাইভ সার্ভিস লোড করা যায়নি। আপাতত ডেমো ডেটা দেখানো হচ্ছে।',
      apiBackedServiceRecord: 'এই সার্ভিস রেকর্ড API দ্বারা চালিত।',
      teamAssignmentNote: 'লাইভ টিম ডেটা যুক্ত না হওয়া পর্যন্ত টিম অ্যাসাইনমেন্ট শুধু প্রিভিউয়ের জন্য।',
    },
    staff: {
      title: 'টিম',
      subtitle: 'গ্রাহকরা যাদের সাথে বুক করতে পারে তাদের ম্যানেজ করুন।',
      addTeamMember: 'টিম মেম্বার যোগ করুন',
      loading: 'টিম লোড হচ্ছে...',
      demoNote: 'লাইভ টিম রেকর্ড পাওয়া না গেলে Glow Beauty Salon টিম উদাহরণ দেখানো হচ্ছে।',
      teamMembers: 'টিম সদস্য',
      availableNow: 'এখন উপলব্ধ',
      totalBookings: 'মোট বুকিং',
      avgPerMember: 'প্রতি সদস্যে গড়',
      services: 'সার্ভিস',
      schedule: 'সময়সূচি',
      edit: 'এডিট',
      delete: 'মুছুন',
      editTeamMember: 'টিম মেম্বার এডিট করুন',
      addTeamMemberDialog: 'টিম মেম্বার যোগ করুন',
      updateMemberDescription: 'এই টিম মেম্বারকে আপডেট করুন।',
      addMemberDescription: 'গ্রাহকরা যার সাথে বুক করতে পারে এমন একজন টিম মেম্বার যোগ করুন।',
      fullName: 'পূর্ণ নাম',
      role: 'পদ',
      email: 'ইমেইল',
      phone: 'ফোন',
      status: 'স্ট্যাটাস',
      active: 'সক্রিয়',
      inactive: 'নিষ্ক্রিয়',
      saveChanges: 'পরিবর্তন সেভ করুন',
      addMemberAction: 'টিম মেম্বার যোগ করুন',
      saving: 'সেভ হচ্ছে...',
      noEmail: 'ইমেইল নেই',
      noPhone: 'ফোন নেই',
      noServices: 'এখনও কোনো সার্ভিস নির্ধারিত নয়',
      noSchedule: 'সময়সূচি সেট করা হয়নি',
      viewSchedule: 'সময়সূচি দেখুন',
      editHours: 'সময়সূচি এডিট করুন',
      scheduleNotConfigured: 'সময়সূচি সেট করা হয়নি',
      memberNameRequired: 'সদস্যের নাম প্রয়োজন।',
      teamMember: 'টিম সদস্য',
      memberAdded: 'টিম সদস্য যোগ করা হয়েছে।',
      memberUpdated: 'টিম সদস্য আপডেট হয়েছে।',
      savedThroughApi: 'টিম সদস্য সেভ হয়েছে।',
      savedLocallyOnly: 'শুধু লোকালি সেভ হয়েছে।',
      tenantScopeMissing: 'এই লোকেশন সেভ করতে আগে সাইন ইন করুন।',
      deleteConfirm: '{name} মুছবেন? এটা আর ফেরত আনা যাবে না।',
      deletedThroughApi: '{name} মুছে ফেলা হয়েছে।',
      removedLocallyOnly: '{name} লোকালি মুছে ফেলা হয়েছে।',
      partialLinks: 'টিম ডেটা দেখানো হচ্ছে। কিছু সম্পর্কিত রেকর্ড এখনও লোড হচ্ছে।',
      liveStaffUnavailable: 'লাইভ টিম রেকর্ড লোড করা যায়নি। আপাতত ডেমো ডেটা দেখানো হচ্ছে।',
      available: 'উপলভ্য',
      busy: 'ব্যস্ত',
      selectStatus: 'স্ট্যাটাস নির্বাচন করুন',
    },
    availability: {
      title: 'কাজের সময়',
      subtitle: 'গ্রাহকরা কখন বুক করতে পারবে তা সেট করুন।',
      loading: 'কাজের সময় লোড হচ্ছে...',
      demoNote: 'লাইভ কাজের সময় পাওয়া না গেলে ডিফল্ট salon hours দেখানো হচ্ছে।',
      weeklySchedule: 'সাপ্তাহিক সময়সূচি',
      assistantUsesHours: 'বুকিং সময় অফার করার সময় assistant এই সময় ব্যবহার করে।',
      applyToAllDays: 'সব দিনে প্রয়োগ করুন',
      saveChanges: 'পরিবর্তন সেভ করুন',
      saving: 'সেভ হচ্ছে...',
      standardHours: 'সেভ করা কাজের সময় পাওয়া না গেলে স্ট্যান্ডার্ড salon hours দেখানো হচ্ছে।',
      defaultHours: 'লাইভ কাজের সময় পাওয়া না গেলে ডিফল্ট salon hours দেখানো হচ্ছে।',
      hoursSaved: 'এই লোকেশনের কাজের সময় সেভ করা হয়েছে।',
      liveHoursUnavailable: 'লাইভ অ্যাকাউন্টে কাজের সময় সেভ করা যায়নি। আপনার পরিবর্তনগুলো এই স্ক্রিনেই থাকবে।',
      invalidHour: '{day} এর বন্ধের সময় খোলার সময়ের পরে হতে হবে।',
      signInMissing: 'টেন্যান্ট scope না থাকায় এখন কাজের সময় সেভ করা যাচ্ছে না।',
      copied: 'এই সময়গুলো সব কার্যদিবসে কপি করা হয়েছে।',
      monday: 'সোমবার',
      tuesday: 'মঙ্গলবার',
      wednesday: 'বুধবার',
      thursday: 'বৃহস্পতিবার',
      friday: 'শুক্রবার',
      saturday: 'শনিবার',
      sunday: 'রবিবার',
    },
    channels: {
      title: 'WhatsApp',
      subtitle: 'বাংলাদেশের বেশিরভাগ গ্রাহক যে একটি চ্যানেল ব্যবহার করে, সেখান থেকেই শুরু করুন।',
      loading: 'WhatsApp সেটআপ লোড হচ্ছে...',
      refreshing: 'রিফ্রেশ হচ্ছে...',
      refresh: 'রিফ্রেশ',
      number: 'নম্বর',
      lastChecked: 'শেষ দেখা',
      notSyncedYet: 'এখনও সিঙ্ক হয়নি',
      notConnected: 'কানেক্ট হয়নি',
      paused: 'থামানো',
      connected: 'কানেক্টেড',
      needsSetup: 'সেটআপ দরকার',
      noNumberConnected: 'কোনো WhatsApp নম্বর কানেক্ট করা নেই',
      inboxTitle: 'WhatsApp বুকিং ইনবক্স',
      inboxDescription: 'গ্রাহকরা এই নম্বরে মেসেজ করবে। ইজি অ্যাসিস্ট্যান্ট reply দিতে, তথ্য নিতে, আর সময় বুক করতে সাহায্য করতে পারে।',
      keepLaunchFocused: 'শুরুর ফোকাস এখানেই রাখুন। WhatsApp বুকিং নির্ভরযোগ্য না হওয়া পর্যন্ত অন্য চ্যানেল যোগ করবেন না।',
      connectWhatsApp: 'WhatsApp কানেক্ট করুন',
      sendTestMessage: 'টেস্ট মেসেজ পাঠান',
      beforeGoingLive: 'লাইভে যাওয়ার আগে',
      beforeGoingLiveDescription: 'ব্যবসার মালিকের সাথে মিলেই এগুলো করুন, সেটিংস স্ক্রিনে একা নয়।',
      confirmNumber: 'ব্যবসার WhatsApp নম্বর নিশ্চিত করুন।',
      sendTestCustomerMessage: 'গ্রাহকের মতো একটি টেস্ট মেসেজ পাঠান।',
      checkBookingsPage: 'বুকিংগুলো বুকিং পেজে দেখা যাচ্ছে কি না নিশ্চিত করুন।',
      handoffCheck: 'একজন মানুষ চ্যাট takeover করতে পারছে কি না নিশ্চিত করুন।',
      signInToView: 'WhatsApp সেটআপ দেখতে সাইন ইন করুন।',
      signInToRefresh: 'WhatsApp সেটআপ রিফ্রেশ করতে সাইন ইন করুন',
      loadFailed: 'WhatsApp সেটআপ লোড করা যায়নি। আবার চেষ্টা করুন।',
    },
    assistant: {
      title: 'অ্যাসিস্ট্যান্ট',
      subtitle: 'আপনার receptionist কীভাবে reply দেবে, বুক করবে, আর নিরাপদে হ্যান্ডঅফ করবে তা নিয়ন্ত্রণ করুন।',
      reload: 'রিলোড',
      reset: 'রিসেট',
      status: 'স্ট্যাটাস',
      ready: 'রেডি',
      unsaved: 'সেভ না হওয়া পরিবর্তন',
      lastSaved: 'শেষ সেভ',
      humanHandoff: 'মানুষের কাছে হ্যান্ডঅফ',
      reminders: 'রিমাইন্ডার',
      testAssistant: 'অ্যাসিস্ট্যান্ট টেস্ট',
      customerMessage: 'গ্রাহকের মেসেজ',
      preview: 'অ্যাসিস্ট্যান্ট প্রিভিউ',
      previewOnly: 'শুধু প্রিভিউ। গ্রাহক দেখার আগে পরিবর্তন সেভ করুন।',
      replyStyle: 'Reply style',
      replyStyleDescription: 'আপনার receptionist কীভাবে গ্রাহককে greet করবে আর সাধারণ অনুরোধের উত্তর দেবে সেট করুন।',
      assistantName: 'অ্যাসিস্ট্যান্টের নাম',
      tone: 'Reply-এর ধরন',
      defaultLanguage: 'ডিফল্ট ভাষা',
      greetingMessage: 'Greeting message',
      bookingRules: 'বুকিং নিয়ম',
      bookingRulesDescription: 'assistant কখন বুকিং নিশ্চিত করবে আর রিমাইন্ডার পাঠাবে তা ঠিক করুন।',
      autoConfirmBookings: 'বুকিং স্বয়ংক্রিয়ভাবে নিশ্চিত করুন',
      autoConfirmBookingsDescription: 'স্লট বৈধ হলে বুকিং স্বয়ংক্রিয়ভাবে নিশ্চিত করুন।',
      sendBookingReminders: 'বুকিং রিমাইন্ডার পাঠান',
      sendBookingRemindersDescription: 'নিশ্চিত বুকিংয়ের আগে গ্রাহককে মনে করিয়ে দিন।',
      fallbackAndHandoff: 'ফলব্যাক ও হ্যান্ডঅফ',
      fallbackAndHandoffDescription: 'মানুষ takeover করলে গ্রাহক কী দেখবে তা নিয়ন্ত্রণ করুন।',
      humanHandoffMessage: 'মানুষের কাছে হ্যান্ডঅফ মেসেজ',
      saveAssistant: 'অ্যাসিস্ট্যান্ট সেভ করুন',
      friendly: 'বন্ধুসুলভ',
      professional: 'পেশাদার',
      formal: 'আনুষ্ঠানিক',
      english: 'ইংরেজি',
      bangla: 'বাংলা',
      englishBangla: 'ইংরেজি ও বাংলা',
      notSavedYet: 'এখনও সেভ হয়নি',
      savedRepliesLoaded: 'অ্যাসিস্ট্যান্টের reply লোড হয়েছে।',
      defaultRepliesLoaded: 'ডিফল্ট অ্যাসিস্ট্যান্ট reply লোড হয়েছে।',
      assistantRepliesLoaded: 'অ্যাসিস্ট্যান্টের reply লোড হয়েছে।',
      assistantRepliesSaved: 'অ্যাসিস্ট্যান্টের reply সেভ হয়েছে।',
      discardChanges: 'সেভ না হওয়া পরিবর্তন বাতিল করুন',
      typeToPreview: 'অ্যাসিস্ট্যান্টের reply দেখতে একটি গ্রাহক মেসেজ লিখুন।',
      saveBeforeCustomersSee: 'গ্রাহক দেখার আগে পরিবর্তন সেভ করুন।',
      previewPrompt: 'আপনার receptionist লাইভ হওয়ার আগে একটি গ্রাহক reply প্রিভিউ করুন।',
      signInToSetReplies: 'অ্যাসিস্ট্যান্টের reply সেট করতে সাইন ইন করুন।',
      unableToLoad: 'অ্যাসিস্ট্যান্ট reply লোড করা যাচ্ছে না।',
      unableToSave: 'অ্যাসিস্ট্যান্ট reply সেভ করা যাচ্ছে না।',
    },
    settings: {
      title: 'অ্যাকাউন্ট',
      subtitle: 'পাইলট ব্যবসার যেটুকু অ্যাকাউন্ট তথ্য সত্যিই দরকার, সেটুকু।',
      businessDetails: 'ব্যবসার তথ্য',
      businessDetailsDescription: 'এই তথ্য বুকিং, সময়সূচি, আর গ্রাহক reply-এর জন্য ব্যবহার হয়।',
      businessName: 'ব্যবসার নাম',
      location: 'লোকেশন',
      phone: 'ফোন',
      timezone: 'টাইমজোন',
      city: 'শহর',
      address: 'ঠিকানা',
      signedInAs: 'সাইন ইন করা আছে',
      pilotSupport: 'পাইলট সাপোর্ট',
      pilotSupportDescription: 'প্রোডাক্ট স্থিতিশীল না হওয়া পর্যন্ত অ্যাকাউন্ট পরিবর্তন সাপোর্টেড রাখুন।',
      changeDetails: 'অনবোর্ডিংয়ের সময় বা সাপোর্টের মাধ্যমে ব্যবসার তথ্য বদলান।',
      passwordChanges: 'পাইলট চলাকালে পাসওয়ার্ড ও অ্যাডভান্সড অ্যাকাউন্ট পরিবর্তন সাপোর্টের মাধ্যমে করা হবে।',
      owner: 'মালিক',
      notSet: 'সেট করা হয়নি',
      accountOwner: 'অ্যাকাউন্ট মালিক',
      noEmailSet: 'ইমেইল সেট করা হয়নি',
    },
    account: {
      profile: 'অ্যাকাউন্ট',
      menu: 'আমার অ্যাকাউন্ট',
      logout: 'লগআউট',
    },
    setup: {
      businessDetails: 'আপনার ব্যবসার তথ্য যোগ করুন',
      service: 'কমপক্ষে একটি সার্ভিস যোগ করুন',
      hours: 'কাজের সময় যোগ করুন',
      teamMember: 'একজন টিম মেম্বার যোগ করুন',
      connectWhatsApp: 'WhatsApp কানেক্ট করুন',
      testAssistant: 'আপনার অ্যাসিস্ট্যান্ট টেস্ট করুন',
    },
  },
};
