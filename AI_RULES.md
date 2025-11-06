# AI Rules for this Project

This document outlines the core technologies and specific library usage guidelines for maintaining consistency and best practices within this project.

## Tech Stack Overview

*   **Vite**: Fast build tool for modern web projects.
*   **TypeScript**: Superset of JavaScript that adds static typing, enhancing code quality and maintainability.
*   **React**: A JavaScript library for building user interfaces.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and Tailwind CSS.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **React Router**: Declarative routing for React applications.
*   **Supabase**: Open-source Firebase alternative for backend services (database, authentication).
*   **TanStack React Query**: Powerful asynchronous state management library for data fetching, caching, and synchronization.
*   **Zod**: TypeScript-first schema declaration and validation library.
*   **date-fns**: Modern JavaScript date utility library.
*   **lucide-react**: A collection of beautiful and customizable SVG icons.
*   **Sonner**: An opinionated toast component for React.

## Library Usage Rules

To ensure consistency and leverage the strengths of each library, please adhere to the following guidelines:

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available or requires significant deviation from `shadcn/ui`'s design, create a new, custom component using Tailwind CSS.
*   **Styling**: All styling must be done using `Tailwind CSS` classes. Avoid inline styles or separate CSS files for component-specific styling (except for `src/index.css` for global base styles).
*   **Routing**: Use `react-router-dom` for all client-side navigation and route management. Keep routes defined in `src/App.tsx`.
*   **Backend & Authentication**: All interactions with the backend, including database operations and user authentication, must be handled via the `Supabase` client (`@/integrations/supabase/client`).
*   **Data Fetching & Caching**: For managing server state and data fetching, use `TanStack React Query`.
*   **Form Handling & Validation**: Combine `react-hook-form` for form state management with `Zod` for schema definition and validation of form inputs.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Date Manipulation**: For any date formatting, parsing, or manipulation, use `date-fns`.
*   **Notifications**: For displaying user feedback messages (e.g., success, error), use the `sonner` toast component.
*   **Utility Functions**: Utilize the `cn` utility function (from `src/lib/utils.ts`) for conditionally applying and merging Tailwind CSS classes.