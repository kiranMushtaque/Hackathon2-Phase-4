#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
DOCKERHUB_USERNAME="kiranmushtaque" # <-- IMPORTANT: SET YOUR DOCKER HUB USERNAME HERE
FRONTEND_IMAGE_NAME="todo-chatbot-frontend"
BACKEND_IMAGE_NAME="todo-chatbot-backend"
IMAGE_TAG="0.1.0"
NAMESPACE="todo-chatbot"
BACKEND_HELM_RELEASE="todo-backend"
FRONTEND_HELM_RELEASE="todo-frontend"

# --- Functions ---
step() {
  echo "✅ Step: $1"
}

# --- Main Script ---

# 1. Build and Push Docker Images
step "Building and pushing Docker images"
docker build -t "${DOCKERHUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}" ./frontend
docker push "${DOCKERHUB_USERNAME}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"

docker build -t "${DOCKERHUB_USERNAME}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}" ./backend
docker push "${DOCKERHUB_USERNAME}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"

# 2. Start Minikube and Enable Addons
step "Starting Minikube and enabling Ingress"
minikube start
minikube addons enable ingress

# 3. Create Namespace
step "Creating Kubernetes namespace: ${NAMESPACE}"
kubectl apply -f kubernetes/namespace.yaml

# 4. Deploy Backend with Helm
step "Deploying backend with Helm"
helm install "${BACKEND_HELM_RELEASE}" ./backend/helm \
  --namespace "${NAMESPACE}" \
  --set image.repository="${DOCKERHUB_USERNAME}/${BACKEND_IMAGE_NAME}" \
  --set image.tag="${IMAGE_TAG}" \
  # Add --set for your secrets here if you don't want to put them in values.yaml
  # e.g., --set envSecret.DATABASE_URL="your-db-url"

# 5. Deploy Frontend with Helm
step "Deploying frontend with Helm"
helm install "${FRONTEND_HELM_RELEASE}" ./frontend/helm \
  --namespace "${NAMESPACE}" \
  --set image.repository="${DOCKERHUB_USERNAME}/${FRONTEND_IMAGE_NAME}" \
  --set image.tag="${IMAGE_TAG}"

# 6. Wait for deployments to be ready
step "Waiting for deployments to be ready"
kubectl wait --namespace "${NAMESPACE}" \
  --for=condition=ready pod \
  --selector=app=todo-chatbot-backend \
  --timeout=120s

kubectl wait --namespace "${NAMESPACE}" \
  --for=condition=ready pod \
  --selector=app=todo-chatbot-frontend \
  --timeout=120s

# 7. Print access information
step "Deployment complete!"
MINIKUBE_IP=$(minikube ip)
echo "--------------------------------------------------"
echo "🚀 Your application is ready!"
echo "1. Add the following line to your /etc/hosts file:"
echo "   ${MINIKUBE_IP} todo-chatbot.local"
echo ""
echo "2. Access the application at: http://todo-chatbot.local"
echo "--------------------------------------------------"
