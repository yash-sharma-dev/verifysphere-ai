# VerifySphere - AI-Powered Fake News Detection & Verification

https://verifysphere-ai.vercel.app/ (Web App Link)

VerifySphere is a modern web application designed to help users verify news credibility using AI-powered analysis, trusted sources, and community consensus. Built with React, TypeScript, and a comprehensive UI component library.

![VerifySphere](https://img.shields.io/badge/VerifySphere-AI%20Verification-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite)

## 🌟 Features

### Core Functionality
- **AI-Powered Verification**: Verify news articles, text content, and images using advanced AI analysis
- **Multi-Format Support**: Verify URLs, text content, and uploaded images
- **Credibility Scoring**: Get instant credibility scores with detailed analysis
- **Verification History**: Track and review your past verifications
- **Community Feedback**: View and contribute to community-driven fact-checking

### User Authentication
- **User Signup & Login**: Secure user registration and authentication
- **Email Verification**: OTP-based email verification system
- **Protected Routes**: Secure access to user-specific features
- **Session Management**: Persistent user sessions with localStorage

### User Experience
- **Dark Mode**: Toggle between light and dark themes with a single click
- **Responsive Design**: Fully responsive layout for all device sizes
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Toast Notifications**: User-friendly notifications using Sonner
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd verifysphere-ai-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   - Navigate to `http://localhost:8080` (or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
verifysphere-ai-main/
├── public/                 # Static assets
│   ├── favicon.svg        # Application favicon
│   └── robots.txt         # SEO robots file
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Header.tsx    # Navigation header
│   │   ├── ThemeToggle.tsx # Dark mode toggle
│   │   ├── OTPInput.tsx  # OTP input component
│   │   ├── VerificationInput.tsx
│   │   ├── VerificationReport.tsx
│   │   ├── CredibilityScore.tsx
│   │   └── CommunityFeedback.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   ├── utils.ts      # General utilities
│   │   └── verificationService.ts # Verification logic
│   ├── mocks/            # Mock services
│   │   └── otpService.ts # Mock OTP service
│   ├── pages/            # Page components
│   │   ├── Index.tsx     # Home/verification page
│   │   ├── Signup.tsx    # User registration
│   │   ├── SignupVerify.tsx # OTP verification after signup
│   │   ├── Login.tsx     # User login
│   │   ├── Verify.tsx    # General OTP verification
│   │   ├── Resend.tsx    # Resend OTP page
│   │   ├── Dashboard.tsx # User dashboard
│   │   ├── History.tsx   # Verification history
│   │   └── NotFound.tsx # 404 page
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── package.json           # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🛠️ Technology Stack

### Core
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool and dev server

### UI & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **next-themes** - Theme management

### Routing & Forms
- **React Router DOM 6.30.1** - Client-side routing
- **React Hook Form 7.61.1** - Form management
- **Zod 3.25.76** - Schema validation

### State Management
- **TanStack Query 5.83.0** - Server state management
- **React Context API** - Client state management

### Utilities
- **Sonner** - Toast notifications
- **date-fns** - Date manipulation
- **clsx & tailwind-merge** - Conditional class names

## 📄 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Features in Detail

### Verification System
- Verify news articles by URL
- Verify text content directly
- Verify uploaded images
- Get detailed credibility scores
- View comprehensive verification reports

### Authentication Flow
1. **Signup**: Create a new account with name, email, and password
2. **Email Verification**: Receive and enter OTP code sent to email
3. **Login**: Access your account with email and password
4. **Dashboard**: View verified account status and access features

### OTP System
- 6-digit OTP codes
- 5-minute expiration timer
- Resend functionality with cooldown
- Rate limiting protection
- Email masking for privacy

### Dark Mode
- Single-click toggle between light and dark themes
- System preference detection
- Persistent theme selection
- Smooth transitions

## 🔐 Authentication

The application uses a mock authentication system for demonstration purposes. In production, this should be replaced with:
- Secure password hashing (bcrypt, argon2)
- JWT token management
- Secure session storage
- Backend API integration

## 📝 Mock Services

The application includes mock services for:
- **OTP Service**: Simulates email OTP sending and verification
- **Verification Service**: Simulates AI-powered content verification

**Note**: These are frontend-only mocks. In production, replace with actual backend API calls.

## 🎯 Routes

- `/` - Home page with verification interface
- `/signup` - User registration
- `/signup-verify` - OTP verification after signup
- `/login` - User login
- `/verify` - General OTP verification
- `/resend` - Resend OTP code
- `/dashboard` - User dashboard
- `/history` - Verification history
- `*` - 404 Not Found page

## 🎨 Theming

The application supports:
- **Light Mode**: Default light theme
- **Dark Mode**: Dark theme with optimized colors
- **System Preference**: Automatically matches OS theme preference

Theme colors are defined in `src/index.css` using CSS variables for easy customization.

## 🚧 Development Notes

### Mock Services
- OTP codes are logged to the browser console for testing
- Verification results are simulated
- User data is stored in localStorage (not suitable for production)

### Environment Setup
- Development server runs on port 8080 by default
- Hot module replacement (HMR) is enabled
- TypeScript strict mode is enabled

## 📦 Dependencies

Key dependencies are listed in `package.json`. Major categories:
- React ecosystem (React, React DOM, React Router)
- UI components (Radix UI, shadcn/ui)
- Form handling (React Hook Form, Zod)
- Styling (Tailwind CSS, tailwindcss-animate)
- Utilities (date-fns, clsx, tailwind-merge)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

**VerifySphere** - Fight misinformation with AI-powered verification 🔍
