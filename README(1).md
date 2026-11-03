# FarmToFork Ledger

**A digital traceability and price-transparency platform for agricultural products.**

FarmToFork Ledger is a web application designed to make the journey of agricultural produce easier to understand. It connects product-batch records, QR-based lookup, supply-chain verification steps, and pricing insights in one interface.

🌐 **Live application:** https://finalfff-vercel.vercel.app/

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [What the Application Provides](#what-the-application-provides)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [API Reference](#api-reference)
- [Run Locally](#run-locally)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Important Implementation Notes](#important-implementation-notes)
- [Future Improvements](#future-improvements)
- [Creator](#creator)
- [License](#license)

## Overview

Agricultural products often pass through several stages between the farm and the consumer. When information about origin, handling, verification, and pricing is difficult to access, it becomes harder for consumers to understand a product's journey and for farmers to communicate the value of their produce.

FarmToFork Ledger provides a digital record for each produce batch. A batch can be identified through a QR code, while its product details, recorded verification events, supply-chain status, and price information can be viewed through the application.

The project also includes a rule-based AI-style pricing assessment that compares entered prices with bundled historical market reference data. It is intended as a decision-support feature, not as a certified market-price prediction service.

## Problem Statement

The project focuses on four practical challenges:

- **Limited traceability:** Consumers may not have an accessible view of where a product originated or how it moved through the supply chain.
- **Scattered records:** Product, handoff, and verification information can be recorded in different places.
- **Limited price visibility:** The relationship between the farmer's price and the retail price is not always clear.
- **Data-quality issues:** Incomplete or inconsistent product details can make records less useful.

## What the Application Provides

### 1. Product and batch records

- Create produce records with product, farm, location, harvest, and pricing details.
- Assign a batch identifier and QR lookup code.
- Store product category, certifications, images, and verification information.
- Validate important fields and flag possible data inconsistencies.

### 2. QR-based product lookup

- Generate and display QR codes for product batches.
- Look up a batch using its QR code or batch identifier.
- Present the available product and supply-chain information in a consumer-friendly view.

### 3. Supply-chain verification workflow

The backend includes workflow actions for:

- Creating and editing draft harvest records.
- Submitting a farmer's harvest record for a simulated USDA review step.
- Recording an approval or correction-request outcome in the demo workflow.
- Verifying supply-chain handoffs.
- Maintaining an audit history of recorded actions.

**Note:** The USDA review is a simulated application workflow. The project does not connect to or represent an official USDA system.

### 4. Role-aware operations

The API recognises role labels such as farmer, consumer, aggregator, retailer, and USDA reviewer for workflow permissions. For example, consumer-role requests are prevented from changing or deleting ledger records by the application logic.

These role checks are intended for demonstration. They are not a substitute for production authentication and authorisation.

### 5. AI-assisted price assessment

The pricing module evaluates a product using:

- Farmer-entered price.
- Retail price.
- Product name and category.
- Available historical reference data.
- Seasonal adjustment factors when available.

It returns a pricing comparison, farmer-share calculation, fairness score, status, explanatory flags, and plain-language summaries. The application also provides endpoints for audit status and historical-versus-current comparisons.

The assessment is a rule-based model using bundled reference data. It should not be interpreted as a trained machine-learning model or as verified live market data.

### 6. Image uploads

The API accepts image uploads through Multer memory storage, checks that the uploaded file is an image, applies a 5 MB size limit, and returns a Base64 data URL for the client to use.

### 7. Responsive web interface

The project includes a React single-page interface, product and QR-related components, and supporting interface assets. It is deployed as a web application and can be opened through the live link above.

## How It Works

1. **Create a batch:** A farmer or permitted staff role enters the produce and farm details.
2. **Validate the record:** The API checks required fields, price values, category/name consistency, and harvest-date warnings.
3. **Identify the batch:** The application associates the record with a batch ID and QR lookup code.
4. **Record workflow events:** The demo workflow supports submission, review, approval or correction, and supply-chain handoff verification.
5. **Look up the product:** A consumer can use the QR/batch identifier to view the information available for that batch.
6. **Review pricing insights:** The pricing module compares the entered prices against the bundled reference dataset and explains the resulting assessment.

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Builds the interactive single-page web application. |
| Frontend styling | CSS | Defines the application's layout, components, and responsive presentation. |
| HTTP communication | Axios | Sends requests from the React client to the API. |
| QR generation | `qrcode`, `qrcode.react` | Creates QR codes for batch identification. |
| QR scanning/decoding | `react-qr-reader`, `jsqr` | Supports QR scanning and decoding in the client. |
| Backend | Node.js | Runs the server-side JavaScript application. |
| API framework | Express 5 | Defines REST endpoints and request handling. |
| Image handling | Multer | Receives and validates image uploads in memory. |
| Cross-origin requests | CORS | Configures cross-origin access for API requests. |
| Configuration | dotenv | Loads environment variables when available. |
| Hosting | Vercel | Hosts the deployed frontend and serverless API entry point. |

### Data and storage approach

The current deployment package uses bundled sample product records and historical reference data in the application code. The API's product operations work with in-memory data structures.

**A persistent database is not configured in this version.** Changes made to in-memory records may be lost when the serverless runtime is restarted or a new instance handles a request. A production release should connect a persistent database before being used for real operational records.

### Is this a blockchain application?

The project contains blockchain-style identifiers and audit/verification concepts in its sample records and interface. However, the supplied deployment code does not connect to a blockchain network or submit transactions to a smart contract. Do not treat the current records or hashes as independently verified, tamper-proof on-chain data.

## Application Architecture

```text
             User / Browser
                   |
                   v
          React Single-Page App
          - Product interface
          - QR lookup / scanning
          - Batch information
          - Pricing insights
                   |
             HTTP / REST
                   |
                   v
          Express API (Node.js)
          - Product routes
          - Validation logic
          - Workflow and audit actions
          - Image upload endpoint
          - Pricing assessment
                   |
          ---------------------
          |                   |
          v                   v
   Sample product data   Historical price
   (in-memory)           reference data
```

In the Vercel deployment, the built frontend is served from `public/`, and `api/index.js` exports the Express application as the API entry point.

## API Reference

The main API routes are listed below. All product routes are mounted under `/api/products`, and pricing routes are mounted under `/api/ai`.

### Health and uploads

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Checks whether the API is responding. |
| `POST` | `/api/upload` | Accepts an image in the `image` form-data field and returns a Base64 data URL. |

### Products

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/products` | Returns the available product records. |
| `GET` | `/api/products/:qrCode` | Retrieves a product using its QR/batch lookup code. |
| `GET` | `/api/products/search?q=<query>` | Searches product records. |
| `POST` | `/api/products/validate` | Validates product details and returns warnings. |
| `POST` | `/api/products` | Creates a product draft. |
| `PUT` | `/api/products/:qrCode` | Updates an eligible draft record. |
| `DELETE` | `/api/products/:qrCode` | Deletes an eligible draft record when the role permits it. |
| `POST` | `/api/products/:qrCode/submit-usda` | Submits a draft to the simulated review workflow. |
| `POST` | `/api/products/:qrCode/usda-review` | Records the simulated review outcome. |
| `POST` | `/api/products/:qrCode/verify` | Records a permitted supply-chain verification/handoff. |

### AI and pricing

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/ai/status` | Returns background audit status and recent audit logs. |
| `POST` | `/api/ai/evaluate` | Evaluates the pricing information supplied in the request body. |
| `POST` | `/api/ai/trigger-run` | Triggers an immediate audit pass. |
| `GET` | `/api/ai/historical-comparison` | Compares bundled historical baselines with current in-memory batches. |
| `GET` | `/api/ai/historical-baselines` | Returns the bundled historical reference data. |

The API expects role labels in the `x-user-role` request header for role-dependent demo actions. Since this is not secure authentication, do not expose the demo workflow as a production service without replacing this mechanism.

## Run Locally

The easiest local setup is to use the Vercel deployment package contained in this repository.

### Requirements

- Node.js 18 or later
- npm
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd <repository-folder>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the application

```bash
npm start
```

The package starts the Express application locally. Open:

```text
http://localhost:5001
```

The API health endpoint is:

```text
http://localhost:5001/api/health
```

> The Vercel package contains the pre-built frontend assets in `public/`; it does not contain the original React development source. To make frontend code changes, use the full source project and rebuild the React client before deploying the updated assets.

## Deployment

The live application is hosted on Vercel:

**https://finalfff-vercel.vercel.app/**

To deploy your own copy:

1. Upload or push the Vercel deployment package to a GitHub repository.
2. Import that repository into Vercel.
3. Set the project root directory to the folder containing `package.json`, `vercel.json`, `api/`, and `public/`.
4. Use the package's included Vercel configuration.
5. Deploy and test `/api/health` and the main application URL.

The deployment package includes:
- `public/` — pre-built frontend assets.
- `api/index.js` — Express API entry point.
- `api/routes/` — product and pricing API routes.
- `api/controllers/` — product workflow and validation logic.
- `api/services/` — pricing assessment and audit worker.
- `api/data/` — sample product records and historical reference data.
- `vercel.json` — Vercel routing configuration.

## Project Structure

```text
.
├── api/
│   ├── controllers/
│   │   └── productController.js
│   ├── data/
│   │   ├── historicalMarketData.js
│   │   └── sampleProducts.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   └── products.js
│   ├── services/
│   │   ├── aiBackgroundWorker.js
│   │   └── aiPricingModel.js
│   └── index.js
├── public/
│   ├── assets/
│   ├── static/
│   └── index.html
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

## Important Implementation Notes

- **Demonstration data:** Sample products and historical market references are bundled with the project. They are not a live feed from farms, retailers, or government systems.
- **No persistent database:** Product data is held in memory in this version. Use a database for durable records and multi-user production use.
- **Simulated review:** The USDA-labelled review step is a demonstration workflow and is not an official integration or endorsement.
- **No live blockchain connection:** Blockchain-style fields do not mean that records are currently anchored to a public or private blockchain.
- **Demo role checks:** The `x-user-role` header is a simple role gate, not secure identity verification. Production use requires authentication, server-side authorisation, and audit protection.
- **Serverless background processing:** The code starts a recurring audit timer, but serverless platforms may pause or recycle function instances. A reliable production scheduler should use a dedicated scheduled job or worker.
- **Pricing guidance:** The price assessment is informational and depends on the bundled reference data and rule thresholds. It should not replace verified market quotations or professional decisions.

## Future Improvements

- Add a persistent database for products, users, verification events, and purchase history.
- Implement secure sign-in, role management, and server-side permission checks.
- Integrate trusted external market-price sources and clearly show data timestamps and locations.
- Connect verification events to a real, auditable distributed ledger if required.
- Replace the simulated review step with an authorised integration where available.
- Move recurring audits to a reliable scheduled worker.
- Add automated tests, API documentation, monitoring, and deployment checks.

## Creator

**Created by Suryandu Ganguly**

Live project: https://finalfff-vercel.vercel.app/

## License

This project is distributed under the MIT License. See the [`LICENSE`](LICENSE) file for details.
