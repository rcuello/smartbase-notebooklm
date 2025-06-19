# The Perfect Prompt

## A Step-by-Step Guide for Building Production-Grade SaaS Applications

_Created by Web Prodigies - Subscribe to [@webprodigies](https://youtube.com/@webprodigies) on YouTube to learn how to start a SaaS company using AI_

I used lovable in my video, you can use whatever you want!

## Table of Contents

1. Introduction
2. Project Definition Template
3. Technical Stack Definition
4. Feature Planning
5. UI/UX Requirements
6. Data Model and Backend Planning
7. Authentication and Authorization
8. Payment Integration
9. Deployment and CI/CD
10. Scope Management
11. Complete Prompt Template
12. Best Practices
13. Development Standards

## Introduction

Building a production-grade SaaS application requires clear guidance and careful planning. This guide will help you create prompts that lead to high-quality, coherent applications without common AI-related issues. By following this systematic approach, you'll be able to leverage AI tools to their fullest potential.

## Project Definition Template

Start with a clear project definition that provides context and purpose:

**Template Format:**

```
I need to build a [application type] SaaS application called [name] that solves [problem] for [target users].

The core value proposition is: [1-2 sentence description of main value]
The application should have the following high-level goals:
[Goal 1]
[Goal 2]
[Goal 3]
```

**Example:**

```
I need to build a team task management SaaS application called TaskFlow that solves project organization and team coordination challenges for small to medium-sized businesses.

The core value proposition is: An intuitive, visually-oriented task management system that provides real-time updates and analytics on project progress, saving teams 5+ hours per week on coordination.

The application should have the following high-level goals:
- Provide a visual, drag-and-drop interface for managing tasks
- Enable real-time collaboration between team members
- Offer insightful analytics on productivity and bottlenecks
```

## Technical Stack Definition

Clearly define the technical foundation:

**Template Format:**

```
Technical Stack:
Frontend: [framework] with [styling approach]
Backend: [backend technology]
Database: [database type/service]
Authentication: [auth provider/approach]
State Management: [state management approach]
Hosting/Deployment: [hosting service]

Additional Technologies:
[Any specific libraries or services to incorporate]
```

**Example:**

```
Technical Stack:
Frontend: Next.js 14 with Tailwind CSS for styling
Backend: Next.js API routes and Supabase for additional backend functionality
Database: Supabase PostgreSQL
Authentication: Supabase Auth with social login options
State Management: React Context and SWR for data fetching
Hosting/Deployment: Vercel

Additional Technologies:
- Chart.js for analytics visualizations
- react-beautiful-dnd for drag-and-drop functionality
- Resend for transactional emails
```

## Feature Planning

Define the core features with clear scope:

**Template Format:**

```
Core Features (in priority order):
1. [Feature 1]: [Brief description]
   - Sub-feature A
   - Sub-feature B
2. [Feature 2]: [Brief description]
   - Sub-feature A
   - Sub-feature B
3. [Feature 3]: [Brief description]
   - Sub-feature A
   - Sub-feature B

Features explicitly OUT of scope:
[Feature that should NOT be built]
```

**Example:**

```
Core Features (in priority order):
1. User Management: Complete user system with roles and permissions
   - User registration and authentication
   - Role-based access control (Admin, Manager, Member)
   - Team creation and member invitations
2. Task Board: Kanban-style board for task management
   - Customizable columns (e.g., To Do, In Progress, Done)
   - Task creation with title, description, assignee, due date, priority
   - Drag-and-drop functionality between columns
3. Dashboard: Overview of projects and tasks
   - Task completion metrics
   - Upcoming deadlines
   - Team activity feed

Features explicitly OUT of scope:
- Real-time chat/messaging system
- Document/file management system
- Time tracking features
```

## UI/UX Requirements

Specify design guidelines and layout preferences:

**Template Format:**

```
UI/UX Requirements:
Design Style: [design aesthetic]
Color Scheme: [color preferences]
Responsive Design: [specific breakpoint requirements]
Accessibility: [accessibility standards]

Key UI Components:
[List of important UI components]

Layout Preferences:
[Any specific layout preferences]
```

**Example:**

```
UI/UX Requirements:
Design Style: Modern, clean interface with subtle shadows and rounded corners
Color Scheme: Primary: blue (#3B82F6), Secondary: purple (#8B5CF6), Neutral: slate gray (#64748B)
Responsive Design: Mobile-first approach, with optimized layouts for tablet and desktop
Accessibility: WCAG AA compliance, with keyboard navigation support

Key UI Components:
- Navigation: Sidebar navigation on desktop, bottom navigation on mobile
- Task Cards: Visual representation of tasks with clear status indicators
- Dashboard Widgets: Compact, data-rich components with minimal visual noise

Layout Preferences:
- Use a card-based interface for main content areas
- Implement collapsible sections for complex forms
- Keep primary actions visible and easily accessible
```

## Data Model and Backend Planning

Define the data structure and relationships:

**Template Format:**

```
Data Model:
1. [Entity 1]:
   - Fields: [List of fields with types]
   - Relationships: [Relationships to other entities]
2. [Entity 2]:
   - Fields: [List of fields with types]
   - Relationships: [Relationships to other entities]

API Endpoints:
[HTTP Method] [Endpoint] : [Purpose]
```

**Example:**

```
Data Model:
1. User:
   - Fields: id (UUID), email (string), name (string), avatar (string), created_at (timestamp)
   - Relationships: belongs to many Teams, has many Tasks (assigned)
2. Team:
   - Fields: id (UUID), name (string), description (text), created_at (timestamp)
   - Relationships: has many Users, has many Projects
3. Project:
   - Fields: id (UUID), name (string), description (text), status (enum), team_id (UUID)
   - Relationships: belongs to Team, has many Tasks
4. Task:
   - Fields: id (UUID), title (string), description (text), status (enum), priority (enum), due_date (date), project_id (UUID), assignee_id (UUID), created_at (timestamp)
   - Relationships: belongs to Project, belongs to User (assignee)

API Endpoints:
GET /api/projects : Get all projects for the authenticated user
POST /api/projects : Create a new project
GET /api/projects/:id : Get project details
PUT /api/projects/:id : Update project details
DELETE /api/projects/:id : Delete a project
GET /api/projects/:id/tasks : Get all tasks for a project
```

## Authentication and Authorization

Specify the authentication flow and permission model:

**Template Format:**

```
Authentication:
Provider: [Authentication provider]
Methods: [Login methods]
Flow: [Authentication flow description]

Authorization:
Role System: [Description of roles]
Permission Model: [How permissions work]
Security Considerations: [Security requirements]
```

**Example:**

```
Authentication:
Provider: Supabase Auth
Methods: Email/password, Google OAuth, GitHub OAuth
Flow: Redirect-based auth with JWT tokens stored securely

Authorization:
Role System: Three-tier role system: Admin, Manager, Member
Permission Model: Row-level security (RLS) in Supabase with policy functions
Security Considerations:
- Implement CSRF protection
- Set proper secure and httpOnly flags for cookies
- Apply rate limiting on authentication endpoints
```

## Payment Integration

If applicable, define payment requirements:

**Template Format:**

```
Payment Requirements:
Provider: [Payment provider]
Pricing Model: [Subscription/one-time/etc.]
Plans: [Different pricing tiers]
Features: [Payment features needed]
```

**Example:**

```
Payment Requirements:
Provider: Stripe
Pricing Model: Monthly and annual subscription plans
Plans:
- Free: Basic features, limit of 3 projects and 5 team members
- Pro ($12/user/month): Unlimited projects, advanced reporting
- Enterprise ($25/user/month): Custom fields, priority support, SAML SSO
Features:
- Seamless checkout experience
- Automatic billing and invoicing
- Proration for plan changes
- Team seat management
```

## Deployment and CI/CD

Specify deployment and maintenance requirements:

**Template Format:**

```
Deployment Strategy:
Hosting: [Hosting platform]
CI/CD: [CI/CD approach]
Environment Setup: [Environment configuration]
```

**Example:**

```
Deployment Strategy:
Hosting: Vercel for frontend and serverless functions
CI/CD: GitHub Actions for testing, Vercel for deployment
Environment Setup:
- Development, staging, and production environments
- Environment-specific variables for API keys and endpoints
- Database migrations handled via Supabase migration tools
```

## Scope Management

Set clear boundaries to prevent scope creep:

**Template Format:**

```
Development Constraints:
Focus first on: [Initial focus]
Required for MVP: [Minimum viable product requirements]
Nice to have: [Features to add if time permits]
Do not implement: [Features explicitly out of scope]
```

**Example:**

```
Development Constraints:
Focus first on: Core user authentication and basic project management functionality
Required for MVP: User registration, project CRUD, basic task management
Nice to have: Analytics dashboard, email notifications, activity logs
Do not implement: Real-time chat, file storage system, or time tracking functionality
```

## Complete Prompt Template

Putting it all together into a comprehensive prompt:

**Full Template:**

```
I need a production-grade [application type] SaaS application called [name] that solves [problem] for [target users].
The core value proposition is: [1-2 sentence description of main value]

Technical Stack
- Frontend: [framework] with [styling approach]
- Backend: [backend technology]
- Database: [database type/service]
- Authentication: [auth provider/approach]
- Additional: [any specific libraries or services]

Core Features (in priority order)
1. [Feature 1]: [Brief description]
   - Sub-feature A
   - Sub-feature B
2. [Feature 2]: [Brief description]
   - Sub-feature A
   - Sub-feature B
3. [Feature 3]: [Brief description]
   - Sub-feature A
   - Sub-feature B

Features explicitly OUT of scope:
[Feature that should NOT be built]

UI/UX Requirements
- Design Style: [design aesthetic]
- Color Scheme: [color preferences]
- Responsive Design: [specific requirements]

Data Model
1. [Entity 1]:
   - Fields: [List of fields with types]
   - Relationships: [Relationships to other entities]
2. [Entity 2]:
   - Fields: [List of fields with types]
   - Relationships: [Relationships to other entities]

Authentication and Authorization
- Provider: [Authentication provider]
- Roles: [Description of roles]
- Security: [Security requirements]

Payment Integration (if applicable)
- Provider: [Payment provider]
- Plans: [Different pricing tiers]

Development Approach
- Start with: [Initial focus for implementation]
- Build incrementally: [Order of feature implementation]
- Prioritize: [What's most important to get right]

Please begin by setting up the project structure and implementing [first component/feature to build].
```

## Best Practices

1. **Be Specific:** The more specific your prompt, the better the outcome. Avoid vague requirements.
2. **Use Chat Mode First:** Use AI chat functionality to plan and discuss the project before implementing code.
3. **Incremental Development:** Don't try to build everything at once. Start with core functionality and build outward.
4. **Maintain Knowledge Base:** Update your project's context as the project evolves to keep information consistent.
5. **Limit Scope:** Explicitly state what should NOT be built to prevent feature creep.
6. **Focus on One Feature:** When implementing, focus prompts on one feature or component at a time.
7. **Regular Reviews:** Periodically ask for code reviews and refactoring to maintain quality.
8. **Request Explanations:** Ask for explanations of complex code to ensure you understand what's being built.
9. **Test Cases:** Request test cases for critical functionality.
10. **Responsiveness:** Always specify responsive design requirements to ensure the application works across devices.

## Development Standards

### Documentation

- **README Updates:** After each significant change, update the README.md with:
  - A description of new features/changes implemented
  - Any new environment variables required
  - Updated installation/setup instructions
  - A changelog section with date and summary of changes
- **Code Comments:** Use JSDoc style comments for functions and components
  - Document parameters, return values, and side effects
  - Explain complex logic with inline comments

### Naming Conventions

- **Components:** Use PascalCase for component files and names (e.g., `UserProfile.tsx`)
- **Hooks:** Prefix with "use" and use camelCase (e.g., `useAuthState.ts`)
- **Utilities:** Use camelCase for utility functions (e.g., `formatCurrency.ts`)
- **API Routes:** Use kebab-case for endpoints (e.g., `/api/user-settings`)
- **Database:** Use snake_case for table and column names (e.g., `user_profiles`)
- **CSS Classes:** Use kebab-case for custom class names (e.g., `user-card`)

### File Organization

- Group files by feature rather than by type
- Keep related components, hooks, and utilities together
- Follow a consistent import order: React, external libraries, internal modules

### Environment Variables

- Never replace existing values in .env files
- Always add new variables at the end of the file
- Include a comment explaining the purpose of each variable
- Document all environment variables in README.md
- Use descriptive prefixes for different services (e.g., `STRIPE_`, `SUPABASE_`)

### Error Handling

- Implement proper error boundaries at the page level
- Use try/catch blocks for all async operations
- Provide user-friendly error messages
- Log errors with relevant context for debugging
- Include error recovery mechanisms where appropriate

### Performance Considerations

- Use pagination for large data sets
- Implement proper loading states for all async operations
- Optimize images and assets
- Use React.memo and useMemo for expensive computations
- Implement proper caching strategies for API requests

### Security Standards

- Sanitize all user inputs
- Implement proper CSRF protection
- Use parameterized queries for database operations
- Never store sensitive information in localStorage
- Set appropriate security headers
- Apply rate limiting on authentication endpoints

### Accessibility

- Maintain WCAG AA compliance for all UI components
- Ensure proper keyboard navigation
- Use semantic HTML elements
- Provide appropriate alt text for images
- Maintain sufficient color contrast ratios
- Test with screen readers

### State Management

- Use appropriate state management based on scope:
  - Local component state for isolated UI state
  - React Context for shared application state
  - SWR/React Query for server state
- Avoid prop drilling more than 2 levels deep

### Testing Strategy

- Write unit tests for utility functions
- Create component tests for UI components
- Implement integration tests for critical user flows
- Use mock services for external dependencies

### Development Process

- Break larger features into small, manageable tasks
- Create a descriptive commit message for each change
- Regularly push changes to avoid large, complex merges

_Copyright © 2025 - Web Prodigies - All Rights Reserved_

_For more SaaS development tutorials and resources, subscribe to [@webprodigies](https://youtube.com/@webprodigies) on YouTube_

---

HERES AN IMPROVED VERSION OF THE PROMPT SHOWN IN THE VIDEO SO YOU CAN SEE IT IN ACTION.
I did not have too much time to perfect it, but the guide above should help you get started.

_Created by Web Prodigies - Subscribe to [@webprodigies](https://youtube.com/@webprodigies) on YouTube to learn how to start a SaaS company using AI_

# **Auto AI Task Scheduler – Full Implementation Plan**

## **1. Project Definition**

**Project Name:** Auto AI Task Scheduler  
**Problem It Solves:** Manual scheduling is inefficient; people waste time figuring out when to do tasks.  
**Target Users:**

- Busy professionals managing a packed schedule
- Students juggling multiple deadlines
- Productivity-focused individuals

**Core Value Proposition:**  
This app intelligently schedules tasks based on:

- User-defined availability
- Task priority levels (Urgent, High, Medium, Low)
- Time constraints & workload balance
- Google Calendar synchronization for auto-updates

**High-Level Goals:**

- Automate scheduling based on AI-driven prioritization
- Seamlessly integrate with Google Calendar for live updates
- Offer a **dark-mode-only** sleek UI with **PWA support** for offline use

---

Created by Web Prodigies - Subscribe to @webprodigies on YouTube to learn how to start a SaaS company using AI

## **2. Technical Stack Definition**

### **Frontend:**

- React
- TailwindCSS + ShadCN UI
- zustand for state management
- Custom drag-and-drop scheduler

### **Backend:**

- Supabase (PostgreSQL) for database
- Clerk for authentication (Google + Email/Password login)
- Supabase Edge Functions for serverless API

### **Integrations:**

- Google Calendar API for auto-syncing scheduled tasks
- OpenAI API for AI-based task distribution

### **Deployment & Hosting:**

- Frontend Hosting: Vercel
- Backend Hosting: Supabase

### **Additional Features:**

- PWA Support for offline mode
- Push Notifications for upcoming tasks

---

## **3. Feature Planning**

### **Core Features (Priority Order)**

**Task Creation & Management**

- Users manually enter tasks with details like task name, priority level, estimated duration, deadline, and preferred days.
- AI-generated task suggestions based on user patterns.

**AI-Powered Task Scheduling**

- Automatically distributes tasks across the week based on user availability, task priority, and optimal time slots.
- Avoids scheduling during busy hours and dynamically rearranges tasks if conflicts arise.

**Google Calendar Sync**

- Syncs scheduled tasks with Google Calendar.
- Two-way sync ensures changes in Google Calendar update within the app.

**PWA Support**

- The app is installable on desktop and mobile.
- Offline mode allows task viewing even without internet access.
- Push notifications remind users of upcoming tasks.

### **Features NOT in Scope**

- No real-time messaging system.
- No advanced project management features like Gantt charts or subtasks.
- No file storage for tasks.

---

Created by Web Prodigies - Subscribe to @webprodigies on YouTube to learn how to start a SaaS company using AI

## **4. UI/UX Requirements**

### **Design Style**

- Complex, compact, **dark mode only**, and sleek UI.
- Primary Colors: Black (#000000), purple shades.
- Fully responsive on mobile, tablet, and desktop.

### **Key UI Components**

- **Task Input Form:** Minimal input fields with AI suggestions.
- **Task Board:** Drag-and-drop interface for manual adjustments.
- **Calendar View:** Displays scheduled tasks alongside Google Calendar.

### **Layout Preferences**

- Card-based task UI.
- Collapsible sections for filters and preferences.
- Floating action button for adding tasks.

---

## **5. Data Model & Backend Planning**

### **Database Schema (Supabase - PostgreSQL)**

**User Data:** Stores user ID, email, full name, and scheduling preferences.  
**Task Data:** Stores task title, priority level, estimated duration, deadline, and user ID as a foreign key.  
**Scheduled Task Data:** Stores task ID, AI-generated scheduled time , and Google Calendar event ID for syncing.

---

## **6. Authentication & Authorization**

**Authentication Flow:**

- Uses **Clerk** for authentication.
- Supports **Google login** and **email/password** login.

**Authorization Rules:**

- Users can only access **their own** tasks.
- Task scheduling actions require **valid authentication tokens**.

---

## **7. Payment Integration (Future Scope)**

**Subscription Model (Planned but not in v1)**

- Free plan includes basic AI scheduling.
- Pro plan ($5/month) offers **advanced AI optimization**.
- Stripe integration will handle payments.

---

## **8. Deployment & CI/CD**

### **Hosting Plan**

- Frontend: Vercel for automatic deployments.
- Backend: Supabase for database and serverless functions.

### **CI/CD Strategy**

- GitHub Actions for automated testing.
- Environment Variables needed for:
  - `GOOGLE_CALENDAR_API_KEY`
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`

---

## **9. Development Roadmap (MVP Build Plan)**

### **Week 1: Project Setup & UI Development**

- Initialize **Next.js + TailwindCSS + ShadCN UI**.
- Build **Task Input Form + AI Suggestion UI**.
- Implement **Drag-and-Drop Task Board**.

### **Week 2: Backend & API Development**

- Set up **Supabase PostgreSQL schema**.
- Build **Task Scheduling API using Supabase Edge Functions and OpenAI API**.
- Implement **Google Calendar Sync API**.

### **Week 3: AI Optimization & Scheduling Logic**

- Train **AI model for task prioritization**.
- Fine-tune **scheduling algorithm**.
- Debug **edge cases and task conflicts**.

### **Week 4: Final Testing & Deployment**

- Set up **PWA offline mode and push notifications**.
- Deploy **frontend to Vercel**.
- Deploy **backend on Supabase**.
- Perform **Beta Testing & User Feedback Collection**.

---

## **10. Key Development Best Practices**

- Use **Code Splitting & Lazy Loading** for better performance.
- Implement **TypeScript for Type Safety**.
- Continuously evaluate **AI model performance** to ensure accurate task scheduling.
- Follow **strict authentication security** measures.

---

### **Final Implementation Summary**

- **Tech Stack:** Next.js 15, Supabase, Google Calendar API, OpenAI.
- **AI Features:** Task prioritization and scheduling.
- **Core Features:** Google Calendar sync and AI-based task assignment.
- **Launch Strategy:** Web app (PWA) with a future mobile app.

---

Created by Web Prodigies - Subscribe to @webprodigies on YouTube to learn how to start a SaaS company using AI
