# Kubernetes deployment

## Create the application Secret

`backend-secret.env` is intentionally not committed. Create it locally with the
following keys, using the MongoDB credentials for this deployment:

```text
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=<the MongoDB root password>
MONGODB_URI=mongodb://root:<URL-encoded MongoDB root password>@mongodb:27017/chatApp?authSource=admin
JWT_SECRET=<a long, random signing secret>
```

The MongoDB root password must match the password already initialized in the
database volume. URL-encode special characters in the password used in
`MONGODB_URI`. Keep this file private; `.gitignore` excludes it.

Create or update the Secret before applying the Deployments:

```powershell
kubectl create secret generic backend-secret `
  --namespace chat-app `
  --from-env-file=.\k8s\backend-secret.env `
  --dry-run=client -o yaml | kubectl apply -f -
```

## Apply the manifests

```powershell
kubectl apply -f .\k8s\namespace.yml
```

Create or update the Secret using the command above. Do not apply the env file
as a Kubernetes manifest. After creating the namespace and Secret, apply the
remaining manifests:

```powershell
kubectl apply -f .\k8s\mongodb-pv.yml
kubectl apply -f .\k8s\mongodb-pvc.yml
kubectl apply -f .\k8s\mongodb-deployment.yml
kubectl apply -f .\k8s\mongo-service.yml
kubectl apply -f .\k8s\backend-deployment.yml
kubectl apply -f .\k8s\backend-service.yml
kubectl apply -f .\k8s\frontend-deployment.yml
kubectl apply -f .\k8s\frontend-service.yml
```

The MongoDB PV uses `hostPath` and is suitable for a single-node development
cluster, not durable multi-node production storage.

## Open the application

The frontend Service is exposed on NodePort `30080`. Open
`http://<node-ip>:30080`, and ensure the node firewall allows inbound TCP
port `30080`. For Minikube, use:

```powershell
minikube service frontend --namespace chat-app --url
```

Check that pods are ready and Services have endpoints:

```powershell
kubectl get pods,services,endpoints -n chat-app
kubectl describe pods -n chat-app
kubectl logs deployment/backend-deployment -n chat-app
```
