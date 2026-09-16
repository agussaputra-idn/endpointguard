# 🛡️ EndpointGuard Sentinel Virtual Patch Deployment Guide

## Overview
This Virtual Patch closes the **BOLA / IDOR** vulnerability on `GET /api/v1/invoices/:id` at the network edge before your backend Pull Request is deployed.

---

## 🚀 Deployment Options

### Option 1: Cloudflare Workers (Recommended)
1. In your Cloudflare Dashboard, navigate to **Workers & Pages**.
2. Click **Create Worker** and paste the code from `cloudflare-worker-shield.js`.
3. Add a Route trigger: `*yourdomain.com/api/v1/invoices/*`.
4. Deploy. The patch activates globally in under 5 seconds.

### Option 2: Nginx Reverse Proxy
1. Copy `nginx-waf.conf` into your `/etc/nginx/conf.d/` or server block.
2. Test configuration: `sudo nginx -t`.
3. Reload: `sudo nginx -s reload`.

### Option 3: AWS WAF (API Gateway / CloudFront)
1. In AWS Console, open **WAF & Shield**.
2. Create or import rule group using `aws-waf-rule.json`.
3. Associate with your Application Load Balancer or CloudFront distribution.
