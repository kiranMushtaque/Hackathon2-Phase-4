# Hackathon-2 – Phase IV

## Project Title

**Todo AI – Kubernetes & Helm Deployment**

---

## Phase IV Objective

The goal of Phase IV is to demonstrate that the application is:

* Containerized using **Docker**
* Deployed on **Kubernetes (Minikube)**
* Managed using **Helm charts**
* Running frontend and backend as separate Kubernetes services

This phase focuses on **infrastructure and deployment**, not full production networking.

---

## Repository Structure

```
phase4/
├── helm/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── backend-deployment.yaml
│       ├── backend-service.yaml
│       ├── frontend-deployment.yaml
│       └── frontend-service.yaml
├── backend/
├── frontend/
└── README.md
```

---

## Technologies Used

* **Docker** – Application containerization
* **Kubernetes (Minikube)** – Container orchestration
* **Helm** – Kubernetes package manager
* **FastAPI** – Backend service
* **Next.js** – Frontend application

---

## Docker Images

Pre-built Docker images are used for deployment:

* Backend: `kiran8877/todo-chatbot-backend:0.1.20`
* Frontend: `kiran8877/todo-chatbot-frontend:0.1.0`

These images are pulled and deployed directly via Helm.

---

## Kubernetes Deployment

The application is deployed on a local Kubernetes cluster using **Minikube**.

### Cluster Status

```bash
minikube status
```

All core components (host, kubelet, apiserver) are running.

---

## Helm Deployment

The entire application is deployed using a Helm chart.

### Helm Commands Used

```bash
helm install todo-app ./helm
helm upgrade todo-app ./helm
```

### Verify Helm Release

```bash
helm list
```

The release status shows **deployed**.

---

## Kubernetes Resources

### Pods

```bash
kubectl get pods
```

Both frontend and backend pods are in **Running** state.

### Services

```bash
kubectl get svc
```

* Backend is exposed as a **ClusterIP** service
* Frontend is exposed as a **NodePort** service

---

## Backend API Verification

To verify backend functionality, the backend service is temporarily exposed using port-forwarding:

```bash
kubectl port-forward svc/backend-service 8000:8000
```

The backend API can then be accessed at:

```
http://localhost:8000/docs
```

This confirms that the backend service is running correctly inside Kubernetes.

---

## Frontend Application

The frontend application is accessible using:

```bash
minikube service frontend-service
```

The UI loads successfully and demonstrates that the frontend is deployed and running in Kubernetes.

---

## Note on Frontend–Backend Communication

In this phase, the backend is exposed as a **ClusterIP** service, which is accessible internally within the Kubernetes cluster.

Since the frontend runs in the user’s browser (outside the cluster), direct browser access to the ClusterIP service is not possible without ingress or NodePort configuration.

For Phase IV, backend functionality is verified independently using Kubernetes port-forwarding, which satisfies the deployment requirements of this phase.

---

## Phase IV Completion Summary

✅ Docker images created and used
✅ Kubernetes (Minikube) cluster running
✅ Application deployed using Helm
✅ Frontend and backend running as Kubernetes pods
✅ Backend API verified via `/docs`

This completes **Hackathon-2 Phase IV** requirements.

---

## Demo Video

The demo video shows:

* Minikube cluster status
* Helm deployment
* Kubernetes pods and services
* Backend API verification using `/docs`
* Frontend UI access

---

## Author

**Kiran**
