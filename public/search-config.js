// Icon Search Configuration - Semantic keyword mapping
const IconSearchConfig = {
  
  // Financial & Banking
  bank: ['university', 'building-columns', 'landmark', 'piggy-bank', 'coins', 'dollar-sign', 'credit-card'],
  money: ['dollar-sign', 'coins', 'piggy-bank', 'wallet', 'cash-register', 'credit-card', 'money-bills'],
  payment: ['credit-card', 'paypal', 'stripe', 'apple-pay', 'google-pay', 'wallet', 'cash-register'],
  finance: ['chart-line', 'chart-pie', 'calculator', 'receipt', 'file-invoice'],
  
  // Communication
  phone: ['phone', 'mobile', 'phone-alt', 'phone-square', 'phone-volume'],
  call: ['phone', 'phone-alt', 'phone-volume', 'mobile'],
  email: ['envelope', 'mail-bulk', 'at', 'paper-plane'],
  mail: ['envelope', 'mailbox', 'mail-bulk', 'paper-plane'],
  message: ['comment', 'comments', 'sms', 'comment-dots', 'message'],
  chat: ['comment', 'comments', 'comment-dots', 'rocketchat', 'discord'],
  
  // Social Media
  social: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok'],
  share: ['share', 'share-alt', 'share-square', 'external-link-alt'],
  
  // Navigation & Directions
  arrow: ['arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'chevron-up', 'chevron-down'],
  up: ['arrow-up', 'chevron-up', 'angle-up', 'caret-up', 'sort-up'],
  down: ['arrow-down', 'chevron-down', 'angle-down', 'caret-down', 'sort-down'],
  left: ['arrow-left', 'chevron-left', 'angle-left', 'caret-left'],
  right: ['arrow-right', 'chevron-right', 'angle-right', 'caret-right'],
  back: ['arrow-left', 'undo', 'reply', 'chevron-left'],
  forward: ['arrow-right', 'redo', 'share', 'chevron-right'],
  menu: ['bars', 'hamburger', 'list', 'ellipsis-v', 'ellipsis-h'],
  
  // Files & Documents
  file: ['file', 'file-alt', 'file-text', 'document', 'page'],
  document: ['file-alt', 'file-text', 'file-word', 'file-pdf'],
  pdf: ['file-pdf', 'file-alt'],
  word: ['file-word', 'file-alt'],
  excel: ['file-excel', 'table'],
  image: ['image', 'file-image', 'camera', 'photo'],
  photo: ['image', 'camera', 'file-image'],
  
  // User & People
  user: ['user', 'user-circle', 'user-alt', 'portrait'],
  person: ['user', 'user-circle', 'user-alt', 'male', 'female'],
  people: ['users', 'user-friends', 'people-group'],
  team: ['users', 'user-friends', 'people-group'],
  profile: ['user-circle', 'id-card', 'address-card'],
  
  // Home & Buildings
  home: ['home', 'house', 'house-user'],
  house: ['home', 'house', 'house-user', 'building'],
  building: ['building', 'university', 'hospital', 'store'],
  office: ['building', 'briefcase', 'city'],
  
  // Technology
  computer: ['desktop', 'laptop', 'computer'],
  laptop: ['laptop', 'computer'],
  mobile: ['mobile-alt', 'phone', 'tablet'],
  phone: ['mobile-alt', 'phone', 'smartphone'],
  wifi: ['wifi', 'signal', 'broadcast-tower'],
  internet: ['globe', 'wifi', 'network-wired'],
  
  // Shopping & Commerce
  shop: ['store', 'shopping-bag', 'shopping-cart', 'storefront'],
  store: ['store', 'shopping-bag', 'building', 'storefront'],
  cart: ['shopping-cart', 'cart-plus', 'cart-arrow-down'],
  buy: ['shopping-cart', 'credit-card', 'cash-register'],
  sell: ['tag', 'tags', 'dollar-sign', 'hand-holding-usd'],
  
  // Transportation
  car: ['car', 'car-side', 'automobile'],
  truck: ['truck', 'shipping-fast', 'dolly'],
  plane: ['plane', 'plane-departure', 'plane-arrival'],
  train: ['train', 'subway'],
  ship: ['ship', 'anchor'],
  bike: ['bicycle', 'biking'],
  
  // Weather
  sun: ['sun', 'solar-panel', 'brightness'],
  cloud: ['cloud', 'cloud-sun', 'cloud-rain'],
  rain: ['cloud-rain', 'umbrella', 'cloud-showers-heavy'],
  snow: ['snowflake', 'cloud-snow'],
  
  // Food & Dining
  food: ['utensils', 'hamburger', 'pizza-slice', 'apple-alt'],
  eat: ['utensils', 'hamburger', 'pizza-slice'],
  drink: ['coffee', 'wine-glass', 'cocktail', 'beer'],
  coffee: ['coffee', 'mug-hot'],
  
  // Health & Medical
  health: ['heart', 'heartbeat', 'user-md', 'hospital'],
  medical: ['user-md', 'stethoscope', 'hospital', 'pills'],
  doctor: ['user-md', 'stethoscope'],
  hospital: ['hospital', 'plus-square', 'ambulance'],
  
  // Education
  school: ['school', 'graduation-cap', 'book', 'university'],
  education: ['graduation-cap', 'book', 'school', 'chalkboard'],
  book: ['book', 'book-open', 'bookmark'],
  learn: ['graduation-cap', 'book', 'brain', 'lightbulb'],
  
  // Time & Calendar
  time: ['clock', 'stopwatch', 'hourglass'],
  clock: ['clock', 'alarm-clock'],
  calendar: ['calendar', 'calendar-alt', 'calendar-day'],
  date: ['calendar', 'calendar-alt'],
  
  // Security
  lock: ['lock', 'unlock', 'key', 'shield-alt'],
  security: ['shield-alt', 'lock', 'user-shield', 'key'],
  password: ['key', 'lock', 'eye-slash'],
  
  // Games & Entertainment
  game: ['gamepad', 'dice', 'chess', 'puzzle-piece'],
  play: ['play', 'play-circle', 'youtube'],
  music: ['music', 'headphones', 'volume-up', 'spotify'],
  video: ['video', 'film', 'youtube', 'play-circle'],
  
  // Tools & Settings
  settings: ['cog', 'cogs', 'sliders-h', 'wrench'],
  tools: ['wrench', 'hammer', 'screwdriver', 'toolbox'],
  search: ['search', 'search-plus', 'magnifying-glass'],
  
  // Status & Alerts
  success: ['check', 'check-circle', 'thumbs-up'],
  error: ['times', 'times-circle', 'exclamation-triangle'],
  warning: ['exclamation-triangle', 'exclamation', 'alert'],
  info: ['info', 'info-circle', 'question-circle'],
  
  // Common Actions
  add: ['plus', 'plus-circle', 'plus-square'],
  delete: ['trash', 'trash-alt', 'times'],
  edit: ['edit', 'pen', 'pencil-alt'],
  save: ['save', 'download', 'floppy-disk'],
  cancel: ['times', 'ban', 'window-close'],
  
  // Business & Work
  business: ['briefcase', 'building', 'handshake', 'chart-line'],
  work: ['briefcase', 'laptop', 'coffee', 'building'],
  meeting: ['users', 'video', 'calendar', 'handshake'],
  
  // Sports & Fitness
  sport: ['football-ball', 'basketball-ball', 'baseball-ball', 'running'],
  fitness: ['dumbbell', 'running', 'heartbeat', 'bicycle'],
  
  // Science & Technology
  science: ['flask', 'atom', 'dna', 'microscope'],
  tech: ['microchip', 'robot', 'code', 'laptop-code']
};

// Function to search icons by semantic keywords
function searchIconsBySemantic(searchTerm, allIcons) {
  const term = searchTerm.toLowerCase().trim();
  const results = new Set();
  
  // Direct name match (highest priority)
  allIcons.forEach(icon => {
    if (icon.displayName.toLowerCase().includes(term) || 
        icon.name.toLowerCase().includes(term)) {
      results.add(icon);
    }
  });
  
  // Semantic keyword match
  if (IconSearchConfig[term]) {
    const semanticMatches = IconSearchConfig[term];
    allIcons.forEach(icon => {
      semanticMatches.forEach(keyword => {
        if (icon.displayName.toLowerCase().includes(keyword.toLowerCase()) ||
            icon.name.toLowerCase().includes(keyword.toLowerCase())) {
          results.add(icon);
        }
      });
    });
  }
  
  // Partial keyword match in semantic config
  Object.keys(IconSearchConfig).forEach(keyword => {
    if (keyword.includes(term) || term.includes(keyword)) {
      const semanticMatches = IconSearchConfig[keyword];
      allIcons.forEach(icon => {
        semanticMatches.forEach(match => {
          if (icon.displayName.toLowerCase().includes(match.toLowerCase()) ||
              icon.name.toLowerCase().includes(match.toLowerCase())) {
            results.add(icon);
          }
        });
      });
    }
  });
  
  return Array.from(results);
}

// Function to get search suggestions
function getSearchSuggestions(partialTerm) {
  const term = partialTerm.toLowerCase();
  const suggestions = [];
  
  Object.keys(IconSearchConfig).forEach(keyword => {
    if (keyword.startsWith(term) && keyword !== term) {
      suggestions.push(keyword);
    }
  });
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
}