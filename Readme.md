Project Structure
.
├── backend/ # Node.js API Gateway
│ ├── Dockerfile.backend
│ ├── package.json
│ └── server.js
├── frontend/ # React Chat UI
│ ├── public/
│ │ └── index.html
│ ├── src/
│ │ └── App.js
│ ├── Dockerfile.frontend
│ ├── package.json
│ └── tailwind.config.js
├── mock-banking-api/ # Node.js Mock Temenos T24/IRIS API
│ ├── Dockerfile.mockapi
│ ├── package.json
│ └── server.js
└── docker-compose.yml # Docker Compose for orchestrating services
