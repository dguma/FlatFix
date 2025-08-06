# FlatFix Heroku Deployment Guide

## Prerequisites
1. Heroku CLI installed
2. Git repository initialized
3. MongoDB Atlas account (free tier available)
4. Google Maps API key

## Step 1: Prepare Environment Variables
Create the following environment variables in your Heroku app:

### Required Variables:
```
MONGODB_URI=mongodb+srv://dylanguma:nD1rbjlS2vYK6fH0@cluster0.camyr2k.mongodb.net/flatfix?retryWrites=true&w=majority
JWT_SECRET=your_secure_random_jwt_secret
NODE_ENV=production
```

### Optional Variables:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Step 2: MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist all IP addresses (0.0.0.0/0) for Heroku
5. Get your connection string and update MONGODB_URI

## Step 3: Deploy to Heroku

### Option A: Using Heroku CLI
```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-flatfix-app-name

# Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://dylanguma:nD1rbjlS2vYK6fH0@cluster0.camyr2k.mongodb.net/flatfix?retryWrites=true&w=majority"
heroku config:set JWT_SECRET="your_secure_random_string"
heroku config:set NODE_ENV="production"

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option B: Using Heroku Dashboard
1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Create new app
3. Connect to GitHub repository
4. Add environment variables in Settings > Config Vars
5. Deploy from GitHub

## Step 4: Post-Deployment
1. Check logs: `heroku logs --tail`
2. Open app: `heroku open`
3. Test with multiple devices/browsers

## Troubleshooting
- Check build logs for errors
- Ensure all environment variables are set
- Verify MongoDB connection string
- Check that PORT is not hardcoded (use process.env.PORT)

## Testing Real-time Features
Once deployed, you can properly test:
- Customer and technician on different devices
- Real-time job updates
- Chat functionality
- Location tracking

The deployment includes both frontend and backend, accessible at your Heroku app URL.
