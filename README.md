# Phase IV: Todo Chatbot - Kubernetes Deployment

This document provides step-by-step instructions for deploying the Todo Chatbot application on a local Kubernetes cluster using Minikube and Helm.

## 1. Prerequisites

Before you begin, ensure you have the following tools installed and running:

- **Docker Desktop:** For building and running containers.
- **Minikube:** For running a local Kubernetes cluster.
- **kubectl:** The Kubernetes command-line tool.
- **Helm:** The package manager for Kubernetes.
- **Docker Hub Account:** You will need a Docker Hub account (or another container registry) to push the Docker images.

## 2. Build and Push Docker Images

First, you need to build the Docker images for the frontend and backend and push them to your container registry.

### 2.1. Login to Docker Hub

```sh
docker login
```

### 2.2. Build and Push Frontend Image

Replace `<your-dockerhub-username>` with your Docker Hub username.

```sh
# Build the frontend image
docker build -t <your-dockerhub-username>/todo-chatbot-frontend:0.1.0 ./frontend

# Push the frontend image
docker push <your-dockerhub-username>/todo-chatbot-frontend:0.1.0
```

### 2.3. Build and Push Backend Image

```sh
# Build the backend image
docker build -t <your-dockerhub-username>/todo-chatbot-backend:0.1.0 ./backend

# Push the backend image
docker push <your-dockerhub-username>/todo-chatbot-backend:0.1.0
```

## 3. Prepare Your Local Kubernetes Cluster

### 3.1. Start Minikube

```sh
minikube start
```

### 3.2. Enable Ingress Controller

The simplest way to set up an Ingress controller on Minikube is to enable the addon:

```sh
minikube addons enable ingress
```

## 4. Configure Helm Charts

Before deploying, you need to update the `values.yaml` files for both the frontend and backend Helm charts.

### 4.1. Configure Backend Chart

Open `backend/helm/values.yaml` and update the following values:

- `image.repository`: Set this to `<your-dockerhub-username>/todo-chatbot-backend`.
- `envSecret`: Fill in the values for `DATABASE_URL`, `GEMINI_API_KEY`, `SECRET_KEY`, and `BETTER_AUTH_SECRET`.

### 4.2. Configure Frontend Chart

Open `frontend/helm/values.yaml` and update the following value:

- `image.repository`: Set this to `<your-dockerhub-username>/todo-chatbot-frontend`.

## 5. Deploy the Application

### 5.1. Create the Namespace

```sh
kubectl apply -f kubernetes/namespace.yaml
```

### 5.2. Deploy the Backend

```sh
helm install todo-backend ./backend/helm --namespace todo-chatbot
```

### 5.3. Deploy the Frontend

```sh
helm install todo-frontend ./frontend/helm --namespace todo-chatbot
```

## 6. Access the Application

### 6.1. Get Minikube IP

```sh
minikube ip
```

### 6.2. Update Your Hosts File

Open your local hosts file (e.g., `/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows) and add the following line, replacing `<minikube-ip>` with the IP address from the previous step:

```
<minikube-ip> todo-chatbot.local
```

### 6.3. Access in Browser

You can now access the application by navigating to `http://todo-chatbot.local` in your web browser.

## 7. Cleanup

To remove all the deployed resources, you can run the following commands:

```sh
# Uninstall Helm charts
helm uninstall todo-frontend --namespace todo-chatbot
helm uninstall todo-backend --namespace todo-chatbot

# Delete the namespace
kubectl delete namespace todo-chatbot

# Stop Minikube
minikube stop
```
