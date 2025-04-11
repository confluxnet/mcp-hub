# Solana Node Dashboard

A visual node-based dashboard for building, analyzing, and visualizing Solana blockchain transactions. This tool allows users to create workflows by connecting various nodes to fetch, analyze, and visualize transaction data from the Solana blockchain.

![Solana Dashboard](docs/dashboard-preview.png)

## Features

- **Visual Workflow Builder**: Create workflows by connecting nodes with a drag-and-drop interface
- **Transaction Analysis**: Analyze Solana transactions using specialized nodes
- **Data Visualization**: Convert transaction data into visual formats, including Mermaid diagrams
- **Account History**: Fetch and analyze account transaction history
- **Intelligent Insights**: Get AI-powered insights from transaction patterns
- **No Code Solution**: Perform complex blockchain analysis without writing code

## Nodes

The dashboard includes several categories of nodes:

### Solana
- **SolTx Fetch**: Fetch transaction data from Solana blockchain
- **SolTx History**: Get transaction history for an account or program
- **Solana Tx to Mermaid**: Convert transaction data to Mermaid diagrams

### Tx Tools
- **SolTx Expert**: Analyze transaction data and extract key information
- **SolTx Intelligence**: Analyze transaction history to identify patterns and insights

### Data
- **Fetch Data**: Get data from external APIs
- **Filter Data**: Filter arrays of data based on conditions
- **Sort Data**: Sort arrays of data
- **Map Data**: Transform data arrays

### Utils
- **Delay**: Add a delay in the workflow
- **Discord Webhook**: Send data to Discord via webhook
- **Mermaid**: Generate Mermaid diagrams from data

## How It Works

1. Add nodes to the workspace by selecting them from the control panel
2. Connect nodes by dragging from output handles to input handles
3. Configure node parameters as needed
4. Run the workflow to process the data
5. View the results in each node
6. Save and load workflows for later use

## Technical Architecture

The dashboard is built with:
- **React** for the UI components
- **React Flow** for the node-based interface
- **TypeScript** for type-safe coding
- **Tailwind CSS** for styling
- **Node.js** for backend processing

The application maintains a registry of node functions that can be connected together to create data processing pipelines. Each node can process and transform data, with the results flowing to connected nodes.

## Local Development

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/zombcat/node-dashboard.git
cd node-dashboard

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

The application should now be running at http://localhost:3000

## Deployment

The application can be built for production using:

```bash
npm run build
# or
yarn build
```

## Credits

Created by [zombcat](https://github.com/zombcat)
