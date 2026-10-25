# Kubernetes deployment

## Prepare the namespace and Secret

Create the namespace before creating its Secret:

```powershell
kubectl apply -f .\k8s\namespace.yml
```

`backend-secret.env` is intentionally not committed. Create it locally with the
following keys, using the MongoDB credentials for this deployment:

```text
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=<the MongoDB root password>
MONGODB_URI=mongodb://root:<URL-encoded MongoDB root password>@mongodb.chat-app.svc.cluster.local:27017/chatApp?authSource=admin
JWT_SECRET=<a long, random signing secret>
```

The MongoDB root password must match the password already initialized in the
database volume. URL-encode special characters in the password used in
`MONGODB_URI`. Keep this file private; `.gitignore` excludes it. For this EC2
deployment, the MongoDB password and JWT secret were generated on the instance
and stored directly in the Kubernetes Secret; no plaintext secret file is
stored in the repository.

Create or update the Secret before applying the Deployments:

```powershell
kubectl create secret generic backend-secret `
  --namespace chat-app `
  --from-env-file=.\k8s\backend-secret.env `
  --dry-run=client -o yaml | kubectl apply -f -
```

Do not apply the env file as a Kubernetes manifest. After creating the namespace
and Secret, apply the remaining manifests:

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
cluster, not durable multi-node production storage. The claim explicitly uses
an empty storage class to match this static PV.

## Open the application

The frontend Service uses NodePort `30080`. On the EC2 Minikube setup, the
Minikube node network is private, so a systemd-managed `kubectl port-forward`
exposes the frontend on EC2 port `8080`. Open
`http://<ec2-public-ip>:8080`. The EC2 security group must allow inbound TCP
port `8080`; restrict the rule to trusted client IPs when public access is not
needed.

The EC2 instance uses systemd to start Minikube and the port-forward service:

```bash
sudo systemctl status minikube-chatapp.service
sudo systemctl status chatapp-frontend-forward.service
```

Check that pods are ready and Services have endpoints:

```bash
kubectl get pods,services,endpointslices -n chat-app
kubectl describe pods -n chat-app
kubectl logs deployment/backend-deployment -n chat-app
```

The JWT signing key is stored in the `backend-secret` Kubernetes Secret. To
retrieve it from an authorized cluster-admin shell:

```bash
kubectl get secret backend-secret -n chat-app \
  -o jsonpath='{.data.JWT_SECRET}' | base64 --decode
```
