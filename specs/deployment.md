# Phase IV: Deployment Specification

This document provides a detailed specification for deploying the Todo Chatbot application to a local Minikube cluster.

## 1. Prerequisites
- Docker Desktop installed and running.
- Minikube installed.
- `kubectl` CLI installed.
- `helm` CLI installed.
- A Docker Hub account (or other container registry) for pushing images.

## 2. Build Process

### 2.1. Frontend Docker Image
- **Dockerfile:** `frontend/Dockerfile`
- **Build Command:**
  ```sh
  docker build -t <your-dockerhub-username>/todo-chatbot-frontend:0.1.0 ./frontend
  ```
- **Push Command:**
  ```sh
  docker push <your-dockerhub-username>/todo-chatbot-frontend:0.1.0
  ```

### 2.2. Backend Docker Image
- **Dockerfile:** `backend/Dockerfile`
- **Build Command:**
  ```sh
  docker build -t <your-dockerhub-username>/todo-chatbot-backend:0.1.0 ./backend
  ```
- **Push Command:**
  ```sh
  docker push <your-dockerhub-username>/todo-chatbot-backend:0.1.0
  ```
- **Note:** Before building, ensure a `requirements.txt` file exists in the `backend/` directory.

## 3. Kubernetes Deployment Steps

### Step 1: Start Minikube
- **Command:** `minikube start`

### Step 2: Create Namespace
- **File:** `kubernetes/namespace.yaml`
- **Command:** `kubectl apply -f kubernetes/namespace.yaml`
- **Content:**
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: todo-chatbot
  ```

### Step 3: Install Ingress Controller
- **File:** `kubernetes/ingress-controller.yaml` (or using Helm)
- **Command (Minikube Addon):** `minikube addons enable ingress`
- This is the simplest method and is preferred for local development.

### Step 4: Create Secrets
- Create a `secrets.yaml` file (or manage directly with Helm).
- **Manual Command Example:**
  ```sh
  kubectl create secret generic todo-chatbot-secret \
    --namespace=todo-chatbot \
    --from-literal=DATABASE_URL=... \
    --from-literal=GEMINI_API_KEY=... \
    --from-literal=SECRET_KEY=... \
    --from-literal=BETTER_AUTH_SECRET=...
  ```
- **Note:** This step will be handled by the backend Helm chart. The secret values must be populated in `backend/helm/values.yaml` before installation.

## 4. Helm Deployment

The entire application will be deployed using two separate Helm charts.

### 4.1. Backend Helm Chart
- **Location:** `backend/helm/`
- **Purpose:** Deploys the FastAPI backend application.
- **Install Command:**
  ```sh
  helm install todo-backend ./backend/helm \
    --namespace=todo-chatbot \
    --values ./backend/helm/values.yaml
  ```
- **Customizable Values (`values.yaml`):
    - `replicaCount`
    - `image.repository`
    - `image.tag`
    - `image.pullPolicy`
    - `service.port`
    - `env.config` (for ConfigMap)
    - `env.secret` (for Secret)

### 4.2. Frontend Helm Chart
- **Location:** `frontend/helm/`
- **Purpose:** Deploys the Next.js frontend application and the main Ingress resource.
- **Install Command:**
  ```sh
  helm install todo-frontend ./frontend/helm \
    --namespace=todo-chatbot \
    --values ./frontend/helm/values.yaml
  ```
- **Customizable Values (`values.yaml`):
    - `replicaCount`
    - `image.repository`
    - `image.tag`
    - `service.port`
    - `ingress.enabled`
    - `ingress.hosts`
    - `env.config` (for `NEXT_PUBLIC_BACKEND_URL`)

## 5. Verification
1. **Check Pod Status:** `kubectl get pods -n todo-chatbot`
   - Wait for all pods to be in the `Running` state.
2. **Check Service Status:** `kubectl get services -n todo-chatbot`
3. **Check Ingress Status:** `kubectl get ingress -n todo-chatbot`
4. **Access the Application:**
   - Get the Minikube IP: `minikube ip`
   - Add a mapping to your local `/etc/hosts` file (optional but recommended):
     `<minikube-ip> todo-chatbot.local`
   - Access the application in your browser at `http://todo-chatbot.local`.
   - The frontend should load, and API calls to the backend should function correctly.
