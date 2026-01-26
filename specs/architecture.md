# Phase IV: Deployment Architecture

This document describes the deployment architecture for the AI-powered Todo Chatbot on a local Kubernetes (Minikube) cluster.

## 1. System Diagram

```
+--------------------------------------------------------------------------+
| Developer's Local Machine                                                |
|                                                                          |
| +----------------------------------------------------------------------+ |
| | Minikube Cluster (Namespace: todo-chatbot)                           | |
| |                                                                      | |
| |   +----------------+         +-----------------+         +---------+ | |
| |   | Ingress        | ------> | Frontend        | ------> |         | | |
| |   | (nginx)        |         | Service         |         |         | | |
| |   | /*             |         | (ClusterIP)     |         |         | | |
| |   +-------+--------+         +-------+---------+         |         | | |
| |           |                          |                   |         | | |
| |           |                          |                   |  Neon   | | |
| |   +-------+--------+         +-------v---------+         |   DB    | | |
| |   | /api/*         | ------> | Backend         | ------> | (Cloud) | | |
| |   +----------------+         | Service         |         |         | | |
| |                              | (ClusterIP)     |         |         | | |
| |                              +-------+---------+         |         | | |
| |                                      |                   |         | | |
| |                                      |                   +---------+ | |
| | +------------------+       +---------v-------+                       | |
| | | Frontend         |       | Backend         |                       | |
| | | Deployment       |       | Deployment      |                       | |
| | | (Next.js Pods)   |       | (FastAPI Pods)  |                       | |
| | +------------------+       +-----------------+                       | |
| |                                      ^                               | |
| |                                      |                               | |
| | +------------------+       +---------+---------+                     | |
| | | ConfigMap        |       | ConfigMap         |                     | |
| | | (backend URL)    |       | (non-sensitive)   |                     | |
| | +------------------+       +-------------------+                     | |
| |                              +-------------------+                     | |
| |                              | Secret            |                     | |
| |                              | (DB URL, API Keys)|                     | |
| |                              +-------------------+                     | |
| +----------------------------------------------------------------------+ |
|                                                                          |
+--------------------------------------------------------------------------+
```

## 2. Component Breakdown

### 2.1. Minikube Cluster
- A single-node Kubernetes cluster running on the developer's local machine.
- Provides the runtime environment for all containerized services.
- A dedicated namespace, `todo-chatbot`, is used to isolate all project-related resources.

### 2.2. Ingress Controller
- An NGINX Ingress controller is installed in the cluster.
- It acts as the single entry point for all external HTTP traffic.
- **Routing Rules:**
    - Requests to the root path (`/`) and any non-API path (`/*`) are routed to the **Frontend Service**.
    - Requests to `/api/*` are routed to the **Backend Service**.

### 2.3. Frontend
- **Deployment:** Manages a set of pods running the Next.js application container.
- **Service:** A `ClusterIP` service that exposes the frontend pods on port 80 within the cluster, targeting port 3000 on the containers.
- **Container:** A Docker container built from the `frontend/Dockerfile`, based on a Node.js 20 Alpine image.

### 2.4. Backend
- **Deployment:** Manages a set of pods running the FastAPI application container.
- **Service:** A `ClusterIP` service that exposes the backend pods on port 80 within the cluster, targeting port 8000 on the containers.
- **Container:** A Docker container built from the `backend/Dockerfile`, based on a Python 3.12 slim image.
- **Health Checks:** The container includes a health check endpoint to allow Kubernetes to perform liveness and readiness probes.

### 2.5. Configuration
- **Frontend ConfigMap:** A simple ConfigMap will hold the `NEXT_PUBLIC_BACKEND_URL` so the frontend knows how to reach the backend API. In a real-world scenario, this might be configured at build time, but using a ConfigMap provides runtime flexibility.
- **Backend ConfigMap:** Stores non-sensitive configuration for the FastAPI application.
- **Backend Secret:** Stores all sensitive data required by the backend, including:
    - `DATABASE_URL`
    - `GEMINI_API_KEY`
    - `SECRET_KEY`
    - `BETTER_AUTH_SECRET`
  This ensures secrets are not stored in plaintext in version control.

### 2.6. External Services
- **Neon Database:** The PostgreSQL database is hosted on Neon and is accessed by the backend service over the internet. It is not containerized or managed within the Kubernetes cluster.

## 3. Communication Flow
1. The user accesses the Minikube IP address in their browser.
2. The request hits the NGINX Ingress controller.
3. Based on the path, the Ingress routes the request to either the Frontend Service or the Backend Service.
4. The Service load-balances the request to one of the available pods in the corresponding Deployment.
5. If the frontend needs to make an API call, it sends a request to its configured backend URL (e.g., `/api/tasks`), which goes through the Ingress again to be routed to the backend.
6. The backend pod receives the request, processes it, and may communicate with the external Neon database if required.
