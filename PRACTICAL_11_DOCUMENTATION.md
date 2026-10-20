# Practical 11: Containerization with Docker and Docker Compose

**Course Outcome / Program Outcome:** CO1, CO4 / PO3, PO5  
**Objective:** To containerize the full-stack Task Management application (React frontend, Node/Express backend, MongoDB database) into standardized Docker images, orchestrate them using Docker Compose on an isolated bridge network, and achieve single-command deployment.

---

## 📌 1. Aim & Objectives

To implement **containerization** for the three-tier Task Management system using **Docker** and **Docker Compose**, establishing reproducible build environments, eliminating host dependency conflicts, configuring internal network DNS routing between services (`frontend` ──► `backend` ──► `mongodb`), and persisting database records across container lifecycles via named Docker volumes.

### Key Objectives:
1. **Frontend Containerization**: Write an optimized `Dockerfile` for the React (Vite) client, compiling assets and serving the production build on port `5173`.
2. **Backend Containerization**: Write a `Dockerfile` for the Express.js API, setting up the runtime environment, caching, and event listener pipelines on port `5000`.
3. **Database Integration**: Provision an official `mongo:latest` database container with persistent storage volumes (`mongo-data:/data/db`).
4. **Service Orchestration (`docker-compose.yml`)**: Define services, dependency graphs (`depends_on`), environment variables, port mappings, and bridge networks.
5. **Inter-Service DNS Networking**: Configure the backend to communicate with MongoDB using container service name discovery (`mongodb://mongodb:27017/taskDB`) instead of hardcoded hostnames.
6. **Single-Command Launch**: Ensure the entire multi-container application stack starts seamlessly with `docker compose up --build` with zero manual intervention.

---

## 🏗️ 2. Architectural Overview & Network Topology

### Multi-Container Topology on `app-network`:

```text
=============================================================================
DOCKER COMPOSE ORCHESTRATION TOPOLOGY
=============================================================================

 Host Browser / Client (Host Machine)
       │                              │
       │ HTTP :5173                   │ HTTP :5000
       ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Docker Host Bridge Network: "app-network"                                 │
│                                                                           │
│   ┌───────────────────────────┐           ┌───────────────────────────┐   │
│   │   frontend (Container)    │           │    backend (Container)    │   │
│   │   Image: React + Vite     │           │    Image: Node/Express    │   │
│   │   Port: 5173:5173         │           │    Port: 5000:5000        │   │
│   └─────────────┬─────────────┘           └─────────────┬─────────────┘   │
│                 │                                       │                 │
│                 │ API Calls (Client Browser)            │ DNS: "mongodb"  │
│                 └──────────────────────────────────────►│ (Internal Port  │
│                                                         │  27017)         │
│                                                         ▼                 │
│                                           ┌───────────────────────────┐   │
│                                           │    mongodb (Container)    │   │
│                                           │    Image: mongo:latest    │   │
│                                           │    Port: 27017:27017      │   │
│                                           └─────────────┬─────────────┘   │
│                                                         │                 │
└─────────────────────────────────────────────────────────┼─────────────────┘
                                                          ▼
                                            ┌───────────────────────────┐
                                            │ Named Volume: mongo-data  │
                                            │ Mount: /data/db           │
                                            │ (Persistent Data Storage) │
                                            └───────────────────────────┘
```

### Key Architectural Concepts:
1. **Internal Bridge Network (`app-network`)**: An isolated software bridge created by Docker Compose. Containers on this network can communicate with one another using service names as hostnames (`mongodb`, `backend`, `frontend`).
2. **Container DNS Resolution**: When the backend connects to `mongodb://mongodb:27017/taskDB`, Docker's embedded DNS server automatically resolves the hostname `mongodb` to the internal IP assigned to the MongoDB container (e.g., `172.18.0.2`).
3. **Data Persistence (`mongo-data`)**: If containers are stopped or removed (`docker compose down`), MongoDB data remains preserved in the Docker managed volume `mongo-data` and is remounted on the next launch.

---

## 🛠️ 3. Step-by-Step Implementation

### Step 1: Verify Docker and Docker Compose Installation
Verified Docker Engine and Docker Compose versions on the host machine:

```bash
docker --version
# Output: Docker version 29.9.1, build dfc520d

docker compose version
# Output: Docker Compose version v5.6.0
```

---

### Step 2: Backend Containerization
Created [`task-manager-api/Dockerfile`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/Dockerfile):

```dockerfile
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Created [`task-manager-api/.dockerignore`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/.dockerignore):
```text
node_modules
npm-debug.log
.git
.env
```

Created [`task-manager-api/server.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/server.js) as an entry point alias:
```javascript
// Entry point alias forwarding to index.js
require('./index.js');
```

---

### Step 3: Frontend Containerization
Configured [`frontend/vite.config.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/frontend/vite.config.js) to enable container network binding on port `5173`:

```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

Created [`frontend/Dockerfile`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/frontend/Dockerfile):

```dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host"]
```

Created [`frontend/.dockerignore`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/frontend/.dockerignore):
```text
node_modules
dist
.git
```

---

### Step 4: Docker Compose Orchestration (`docker-compose.yml`)
Created [`docker-compose.yml`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/docker-compose.yml) at the project root to orchestrate all three services:

```yaml
services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  backend:
    build:
      context: ./task-manager-api
      dockerfile: Dockerfile
    container_name: backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://mongodb:27017/taskDB
      - JWT_SECRET=mySuperSecretJwtKeyTaskFlow2026!
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: frontend
    restart: always
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
```

---

### Step 5: Backend Connection Configuration
The backend [`task-manager-api/index.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/index.js) connects using `process.env.MONGO_URI`:

```javascript
// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskDB')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));
```

When started via Docker Compose, `process.env.MONGO_URI` resolves to `mongodb://mongodb:27017/taskDB`, utilizing the `mongodb` container name defined in `docker-compose.yml`.

---

## 📊 4. Measured Experimental Results & Verification

### 1. Stack Startup Command:
```bash
docker compose up -d
```

### 2. Container Status (`docker ps`):
```text
CONTAINER ID   IMAGE                                COMMAND                  CREATED          STATUS          PORTS                                             NAMES
dd58082f0a60   task-manager-api-24dce106-frontend   "docker-entrypoint.s…"   41 seconds ago   Up 39 seconds   0.0.0.0:5173->5173/tcp, [::]:5173->5173/tcp       frontend
116a47fe081f   task-manager-api-24dce106-backend    "docker-entrypoint.s…"   42 seconds ago   Up 39 seconds   0.0.0.0:5000->5000/tcp, [::]:5000->5000/tcp       backend
1649416a20fe   mongo:latest                         "docker-entrypoint.s…"   43 seconds ago   Up 40 seconds   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   mongodb
```

### 3. Container Logs:

#### Backend Container Logs (`docker logs backend`):
```text
Task Manager API Server Running
URL: http://localhost:5000
MongoDB connected successfully
```

#### Frontend Container Logs (`docker logs frontend`):
```text
> frontend@0.0.0 preview
> vite preview --host

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://172.18.0.4:5173/
```

### 4. End-to-End API Execution in Containers:
A full user lifecycle and task creation flow was tested against the containerized stack:
1. **User Registration (`POST /register`)**: User `docker_test@example.com` created in MongoDB.
2. **User Login (`POST /login`)**: JWT token issued.
3. **Task Creation (`POST /tasks`)**:
   ```json
   {
     "success": true,
     "message": "Task created successfully",
     "data": {
       "_id": "6ad76e355777242fa467a159",
       "title": "Containerized Task in Docker",
       "description": "Testing Practical 11",
       "completed": false,
       "user": {
         "_id": "6ad76e355777242fa467a158",
         "email": "docker_test@example.com"
       }
     }
   }
   ```
4. **Task Retrieval (`GET /tasks`)**: Returned 1 task (`HTTP 200 OK`).
5. **Frontend Delivery (`GET http://localhost:5173/`)**: Returned `HTTP 200 OK`.

---

## 🔍 5. Technical Highlights & Troubleshooting

| Challenge | Cause | Resolution |
| :--- | :--- | :--- |
| **Node.js Engine Incompatibility** | Vite 8 and Rolldown require Node.js 20+ (`node:util.styleText`). Using `node:18` failed build. | Upgraded base image from `node:18` to **`node:20`** in both Dockerfiles. |
| **Vite Preview Host Binding** | By default, `vite preview` listens on `localhost` (loopback), blocking external container requests. | Configured `preview: { host: '0.0.0.0', port: 5173 }` in `vite.config.js`. |
| **DNS Service Discovery** | Hardcoded `localhost:27017` refers to the backend container itself, not MongoDB. | Configured `MONGO_URI=mongodb://mongodb:27017/taskDB` utilizing Docker's embedded DNS. |
| **Build Optimization** | Unnecessary files (`node_modules`, `.git`, `.env`) bloated image context. | Added comprehensive `.dockerignore` files for both frontend and backend. |

---

## 🧪 6. Testing Guide

### Complete Stack Lifecycle Commands:

1. **Start Stack**:
   ```bash
   docker compose up --build -d
   ```
2. **Verify Containers**:
   ```bash
   docker ps
   ```
3. **View Live Logs**:
   ```bash
   docker compose logs -f
   ```
4. **Access Applications**:
   - **Frontend UI**: Open [http://localhost:5173](http://localhost:5173) in your browser.
   - **Backend API**: Send requests to [http://localhost:5000](http://localhost:5000).
   - **MongoDB**: Connect using MongoDB Compass at `mongodb://localhost:27017`.
5. **Stop Stack**:
   ```bash
   docker compose down
   ```
   *(Add `-v` if you wish to remove persistent volumes as well: `docker compose down -v`)*

---

## 🎯 7. Key Learnings & Takeaways

1. **Environmental Parity**:
   - Containerization guarantees that the software runs identically across local development, CI/CD pipelines, and production servers, eliminating the "works on my machine" syndrome.
2. **Microservice Networking**:
   - Docker Compose user-defined bridge networks provide automatic service discovery through internal DNS resolution, allowing decoupled microservices to connect using logical names.
3. **Stateless vs. Stateful Containers**:
   - Application containers (`frontend`, `backend`) remain stateless and disposable, while stateful services (`mongodb`) preserve data reliably through external volume mounts.
