# QueSkip Backend - Production Checklist

## Pre-Deployment

### Database
- [ ] PostgreSQL database created on Render
- [ ] PostGIS extension enabled
- [ ] Database schema migrated
- [ ] Database indexes created
- [ ] Connection string configured

### Environment Variables
- [ ] NODE_ENV=production
- [ ] DATABASE_URL configured
- [ ] JWT_SECRET (strong, unique)
- [ ] JWT_REFRESH_SECRET (strong, unique)  
- [ ] ALLOWED_ORIGINS (frontend domains)
- [ ] EMAIL credentials (if using email features)
- [ ] STRIPE keys (if using payments)
- [ ] FCM_SERVER_KEY (if using push notifications)

### Security
- [ ] Strong JWT secrets (32+ characters)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] XSS protection

### Performance
- [ ] Database connection pooling
- [ ] Compression middleware enabled
- [ ] Response caching where appropriate
- [ ] Database queries optimized
- [ ] Indexes on frequently queried fields

### Monitoring
- [ ] Logging configured (Winston)
- [ ] Error tracking setup
- [ ] Health check endpoint working
- [ ] API documentation accessible

### Testing
- [ ] All endpoints tested
- [ ] Authentication flows verified
- [ ] Database operations tested
- [ ] Error handling verified
- [ ] Rate limiting tested

## Deployment Steps

1. **Render Setup**
   - Create new Web Service
   - Connect GitHub repository
   - Configure build and start commands
   - Set environment variables

2. **Database Setup**
   - Create PostgreSQL service
   - Enable PostGIS extension
   - Run schema migration
   - Test connection

3. **DNS & SSL**
   - Configure custom domain (if applicable)
   - SSL certificate automatically provisioned
   - Test HTTPS endpoints

4. **Frontend Integration**
   - Update frontend API base URL
   - Test all API integrations
   - Verify CORS configuration

## Post-Deployment

### Verification
- [ ] Health check endpoint responds
- [ ] API documentation loads
- [ ] Authentication works
- [ ] Database queries execute
- [ ] Error handling works
- [ ] Rate limiting functional

### Performance Testing
- [ ] Load testing performed
- [ ] Response times acceptable
- [ ] Database performance optimized
- [ ] Memory usage monitored

### Security Audit
- [ ] Security headers present
- [ ] Authentication secure
- [ ] Input validation working
- [ ] No sensitive data exposed

## Render Configuration

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

### Environment Variables
```
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your_production_jwt_secret
JWT_REFRESH_SECRET=your_production_refresh_secret
ALLOWED_ORIGINS=https://your-frontend-domain.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Health Check
Render will automatically check: `GET /health`

## Maintenance

### Regular Tasks
- Monitor server logs
- Check database performance
- Update dependencies
- Review security alerts
- Backup database
- Monitor API usage

### Scaling Considerations
- Database connection limits
- Rate limiting adjustments
- Server resource monitoring
- CDN for static assets
- Load balancing (if needed)
