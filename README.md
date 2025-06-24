 # comp_table - AI-Powered Competitor Analysis Table

Generate comprehensive competitor analysis tables using multiple LLMs for crowdsourced insights.

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone [your-repo-url]
   cd comp-table
   npm install
   ```

2. **Set up API Keys**
   - Get an OpenRouter API key from [openrouter.ai](https://openrouter.ai)
   - Get a Groq API key from [console.groq.com](https://console.groq.com)
   - The app will prompt you to enter these on first run

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── types/          # TypeScript interfaces
├── api/            # API clients (OpenRouter, Groq)
├── utils/          # Normalization and aggregation logic
├── components/     # React components
├── hooks/          # Custom React hooks
└── App.tsx         # Main application
```

## 🔧 How It Works

1. **Multi-LLM Crowdsourcing**: Queries 9 different LLMs for competitors and comparison criteria
2. **Intelligent Normalization**: Uses Llama models via Groq to normalize and deduplicate responses
3. **Frequency-Based Ranking**: Selects top 10 competitors and criteria based on consensus
4. **Clean Table Generation**: Creates a structured 10x10 comparison table

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **APIs**: OpenRouter (multi-LLM access), Groq (normalization)
- **State Management**: React hooks

## 📝 Next Steps in Cursor

1. **Enhance Normalization Logic**
   - Improve entity disambiguation
   - Add custom rules for specific industries

2. **Add Data Population**
   - Implement cell value generation
   - Add data validation and formatting

3. **Export Functionality**
   - CSV export
   - JSON export
   - Copy to clipboard

4. **Caching Layer**
   - Cache API responses
   - Implement request deduplication

5. **Advanced Features**
   - Custom LLM selection
   - Adjustable table dimensions
   - Industry-specific templates

## 🤝 Contributing

Feel free to iterate on this codebase using Cursor's AI features. The architecture is designed to be modular and extensible.

## 📄 License

MIT