# MobApp Project Structure

```
mobapp/
├── .env
├── .gitignore
├── app.json
├── eslint.config.js
├── expo-env.d.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
├── .expo/
│   ├── devices.json
│   ├── README.md
│   ├── types/
│   │   └── router.d.ts
│   └── web/
│       └── cache/
│           └── production/
│               └── images/
│                   └── favicon/
│                       └── favicon-a4e0.../
│                           └── favicon-48.png
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── LoadingScreen.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.jsx
│   │   └── signup.jsx
│   ├── (protected)/
│   │   ├── _layout.tsx
│   │   ├── modal.tsx
│   │   ├── (admin)/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ClassManagement.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SystemSettings.jsx
│   │   │   └── UserManagement.jsx
│   │   ├── (attendance)/
│   │   │   ├── AttendanceScreen.jsx
│   │   │   └── SessionScreen.jsx
│   │   ├── (common)/
│   │   │   └── ProfileScreen.jsx
│   │   ├── (profile)/
│   │   │   └── UserProfile.jsx
│   │   ├── (reports)/
│   │   │   ├── ClassReport.jsx
│   │   │   └── ReportsScreen.jsx
│   │   ├── (settings)/
│   │   │   └── SystemSettings.jsx
│   │   ├── (students)/
│   │   │   └── (tabs)/
│   │   │       ├── _layout.jsx
│   │   │       ├── AttendanceScreen.jsx
│   │   │       ├── FingerprintEnrollScreen.jsx
│   │   │       ├── index.jsx
│   │   │       └── StudentDashboard.jsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.jsx
│   │   │   ├── explore.tsx
│   │   │   └── index.jsx
│   │   └── (teachers)/
│   │       ├── ClassListScreen.jsx
│   │       ├── SessionScreen.jsx
│   │       └── TeacherDashboard.jsx
├── assets/
│   └── images/
│       ├── 1.png
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── favicon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── splash-icon.png
├── components/
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/
│       ├── collapsible.tsx
│       ├── icon-symbol.ios.tsx
│       └── icon-symbol.tsx
├── constants/
│   └── theme.ts
├── context/
│   └── AuthContext.js
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
├── scripts/
│   └── reset-project.js
├── services/
│   ├── api.js
│   └── biometric.js
```
