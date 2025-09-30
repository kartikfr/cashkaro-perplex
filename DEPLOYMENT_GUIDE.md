# Python Image Extractor Integration - Deployment Guide

## Overview

This guide covers the deployment of the integrated Python image extractor with your CashKaro project. The integration includes:

1. **Python Image Extraction Service** - Standalone Python service for image extraction
2. **Supabase Edge Functions** - Updated functions that use the Python service
3. **Frontend Updates** - Enhanced image display with quality indicators
4. **Fallback Mechanisms** - Multiple fallback strategies for image extraction

## Architecture

```
Frontend (React) 
    ↓
Supabase Edge Functions
    ↓
Python Image Extraction Service
    ↓
Retailer Websites (Amazon, Flipkart, Myntra, etc.)
```

## Deployment Steps

### 1. Python Service Deployment

#### Option A: Local Development
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the Python service
python product_image_extractor.py

# Test the service
python test_extractor.py
```

#### Option B: Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "product_image_extractor.py"]
```

```bash
# Build and run
docker build -t image-extractor .
docker run -p 8000:8000 image-extractor
```

#### Option C: Cloud Deployment (Recommended)
- **Heroku**: Deploy as a web service
- **Railway**: Simple Python deployment
- **Google Cloud Run**: Serverless Python service
- **AWS Lambda**: Serverless function (with modifications)

### 2. Supabase Edge Functions Deployment

#### Deploy New Functions
```bash
# Deploy the new image extraction function
supabase functions deploy extract-product-images

# Deploy the fallback function
supabase functions deploy image-fallback

# Deploy updated search-products function
supabase functions deploy search-products
```

#### Environment Variables
Set these in your Supabase dashboard:
```bash
PYTHON_IMAGE_SERVICE_URL=https://your-python-service.herokuapp.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Frontend Deployment

#### Update Dependencies
```bash
npm install
npm run build
```

#### Deploy to Vercel/Netlify
```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

## Configuration

### Python Service Configuration

Create `config.json`:
```json
{
  "request_timeout": 10,
  "max_retries": 3,
  "rate_limit_delay": 1.0,
  "max_images_per_product": 5,
  "output_dir": "output",
  "log_file": "image_extractor.log",
  "port": 8000
}
```

### Supabase Configuration

Update `supabase/config.toml`:
```toml
[functions]
verify_jwt = false

[functions.extract-product-images]
verify_jwt = false

[functions.image-fallback]
verify_jwt = false
```

## Testing

### 1. Test Python Service
```bash
# Test individual extraction
python product_image_extractor.py "https://amazon.in/dp/B08X123456"

# Test multiple products
python test_extractor.py

# Test integration
python test_integration.py
```

### 2. Test Supabase Functions
```bash
# Test search function
curl -X POST https://your-project.supabase.co/functions/v1/search-products \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "iPhone 15", "retailer": "all"}'

# Test image extraction
curl -X POST https://your-project.supabase.co/functions/v1/extract-product-images \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://amazon.in/dp/B08X123456"}'
```

### 3. Test Frontend
```bash
# Start development server
npm run dev

# Test in browser
# Navigate to http://localhost:5173
# Search for products and verify images load correctly
```

## Monitoring and Logging

### Python Service Logs
```bash
# View logs
tail -f image_extractor.log

# Check service health
curl http://localhost:8000/health
```

### Supabase Function Logs
```bash
# View function logs
supabase functions logs search-products
supabase functions logs extract-product-images
supabase functions logs image-fallback
```

### Frontend Monitoring
- Check browser console for image loading errors
- Monitor network requests for image URLs
- Verify image quality indicators

## Troubleshooting

### Common Issues

#### 1. Python Service Not Responding
```bash
# Check if service is running
ps aux | grep python

# Check port availability
netstat -tulpn | grep :8000

# Restart service
python product_image_extractor.py
```

#### 2. Supabase Function Errors
```bash
# Check function logs
supabase functions logs search-products --follow

# Verify environment variables
supabase secrets list
```

#### 3. Image Loading Issues
- Check CORS settings
- Verify image URLs are accessible
- Check browser network tab for failed requests

#### 4. Rate Limiting
- Increase delay between requests
- Implement exponential backoff
- Use multiple IP addresses for scraping

### Performance Optimization

#### 1. Image Caching
```typescript
// Add to frontend
const imageCache = new Map<string, string>();

const getCachedImage = (url: string) => {
  if (imageCache.has(url)) {
    return imageCache.get(url);
  }
  // Fetch and cache
  return url;
};
```

#### 2. Lazy Loading
```typescript
// Already implemented in SearchInterface.tsx
<img loading="lazy" decoding="async" />
```

#### 3. Image Compression
```python
# Add to Python service
from PIL import Image
import io

def compress_image(image_data, quality=85):
    img = Image.open(io.BytesIO(image_data))
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True)
    return output.getvalue()
```

## Security Considerations

### 1. API Key Protection
- Store Python service URL in environment variables
- Use Supabase service role key securely
- Implement rate limiting

### 2. Input Validation
- Validate all URLs before processing
- Sanitize user inputs
- Implement request size limits

### 3. Error Handling
- Don't expose internal errors to users
- Log errors securely
- Implement graceful degradation

## Scaling Considerations

### 1. Horizontal Scaling
- Deploy multiple Python service instances
- Use load balancer
- Implement health checks

### 2. Caching Strategy
- Cache extracted images
- Use CDN for image delivery
- Implement Redis for session storage

### 3. Database Optimization
- Index frequently queried fields
- Implement connection pooling
- Use read replicas for heavy queries

## Maintenance

### 1. Regular Updates
- Update Python dependencies monthly
- Monitor for retailer website changes
- Update image extraction patterns

### 2. Performance Monitoring
- Monitor response times
- Track error rates
- Monitor resource usage

### 3. Backup Strategy
- Backup Python service code
- Backup Supabase functions
- Backup configuration files

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error details
3. Test individual components
4. Create GitHub issues for bugs

## Changelog

### Version 1.0.0
- Initial integration
- Python image extraction service
- Supabase Edge Functions
- Frontend image quality indicators
- Multiple fallback mechanisms
- Comprehensive testing suite
