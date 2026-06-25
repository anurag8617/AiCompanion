# ✦ AI Companion Premium Design System (2026)

## 1. Design Tokens & Visual Language

### Colors (Dark Theme First)
- **Background Base**: `#0A0F14` (Deep Rich Black - creates depth and reduces eye strain)
- **Surface / Cards**: `#121A22` (Elevated Navy - separates content from background)
- **Primary Accent**: `#4F7CFF` (Electric Blue - draws attention to primary actions)
- **Primary Hover**: `#3B66E0`
- **Success**: `#22C55E`
- **Warning**: `#FACC15`
- **Error**: `#EF4444`
- **Text Primary**: `#F8FAFC` (High contrast, readable)
- **Text Secondary**: `#94A3B8` (Subtle, hierarchy-defining)

### Geometry & Spacing (8px Grid System)
- **Corner Radii**: 
  - `32px` (Hero Cards, Main Modals - Soft, Apple-level polish)
  - `24px` (Secondary Service Cards)                                                                                                                                                                                               
  - `16px` (Buttons, Inputs)
- **Spacing**: Consistent use of 8, 16, 24, 32, and 48px increments.
- **Glassmorphism**: `rgba(255, 255, 255, 0.03)` with `rgba(255, 255, 255, 0.05)` borders for a premium, frosty depth effect.

### Typography (System Sans-Serif)
- **Hero Title**: 34px, Font Weight 900 (Black), Tracking -1px
- **Section Title**: 22px, Font Weight 800 (Heavy), Tracking -0.5px
- **Body**: 16px, Font Weight 500 (Medium), Line Height 24px
- **Caption**: 13px, Font Weight 600, Tracking 0.5px (Uppercase for labels)

---                                                                                                 

## 2. UI Architecture & Component Tree

To achieve a production-ready modern app, we will replace the custom state-router with a professional `@react-navigation/bottom-tabs` implementation.

```text
App (NavigationContainer)
└── BottomTabNavigator (Blur/Glassmorphism background)
    ├── HomeTab (DashboardScreen)
    │   ├── Header (Avatar, Notifications)
    │   ├── HeroSection (Welcome, AI Status Orb, Quick Actions)
    │   ├── SmartSuggestionsList (Horizontal Scroll)
    │   ├── PremiumServiceCards (Grid with Gradients & Stats)
    │   ├── AIUsageAnalytics (Minimalist Chart/Stats)
    │   └── RecentActivityList
    ├── ChatTab (ChatScreen)
    ├── VoiceTab (VoiceAssistantScreen)
    ├── MemoryTab (MemoriesScreen)
    └── ProfileTab (Settings & Contacts)
```

---

## 3. Implementation Plan

### Phase 1: Foundation & Architecture
1. **Dependencies**: Install `@react-navigation/native`, `@react-navigation/bottom-tabs`, and standard navigation dependencies.
2. **Tokens**: Update `mobile/src/theme/colors.ts` with the new premium dark tokens.
3. **Routing**: Refactor `App.tsx` to implement the `BottomTabNavigator`, providing a solid, extensible foundation.

### Phase 2: The Premium Dashboard Build
1. **Hero Section**: Build a massive, high-impact top section featuring the user's avatar, a dynamic greeting, and a live AI status indicator.
2. **Interactive Cards**: Upgrade the generic grid to premium cards featuring subtle gradient borders, rich icons, and `moti` scale animations on press.
3. **Analytics & Activity**: Introduce the "AI Usage" and "Recent Activity" mock sections to fulfill the SaaS aesthetic requirements.

### Phase 3: Screen Polish & Micro-interactions
1. **Chat & Voice Redesign**: Port the new tokens (`#0A0F14` / `#4F7CFF`) into the Chat and Voice screens.
2. **Refinement**: Apply the 32px radii, adjust line heights, and ensure all shadows map to the new deep-dark environment to hit the "Linear-level smoothness" and "Stripe-level simplicity" goals.