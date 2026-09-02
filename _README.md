# Personal Gemini Journal 📓✨

An authenticated, production-grade journaling web application that leverages the Gemini API for multi-turn brainstorming and automated emotional analytics. Built for the #AccelerateAIwithCloudRun Ideathon.

## Features
* **Secure Authentication:** Integrated Firebase Authentication for user sign-up, sign-in, and instant guest access.
* **Isolated Data Storage:** Cloud Firestore database architecture utilizing strict security rules (`/users/{uid}/journal_entries`) to guarantee zero cross-user data leakage.
* **Multi-Turn AI Brainstorming:** Real-time conversational journaling using the Gemini API.
* **Automated Insights Dashboard:** Extracts primary sentiment and core topics from journal summaries to visualize mood trends and journaling habits over time.
* **Production Deployment:** Containerized and deployed on Google Cloud Run, utilizing server-side environment variables for secure API key management.

## Tech Stack
* **Frontend:** React / TypeScript / HTML / CSS
* **Backend:** Node.js / Google AI Studio Configuration
* **Database & Auth:** Firebase / Cloud Firestore
* **Hosting:** Google Cloud Run
