## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/navgurukul/zuvy-eval.git
cd zuvy-eval
```

### 2. Install Dependencies

```bash
npm i
```

### 3. Create Environment File

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

### 4. Add Environment Variables

Paste the required credentials in the `.env.local` file:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_api_url
# Add other credentials as needed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
