# Product Image Extractor

A Python script to extract product images from various Indian e-commerce websites including Amazon, Flipkart, Myntra, AJIO, Nykaa, and TataCliq.

## Features

- 🛍️ **Multi-retailer support**: Amazon, Flipkart, Myntra, AJIO, Nykaa, TataCliq
- 🖼️ **High-quality images**: Automatically converts to high-resolution images
- 🔍 **Smart extraction**: Multiple extraction methods for better results
- ⚡ **Rate limiting**: Respects website rate limits
- 🛡️ **Error handling**: Robust error handling and validation
- 📊 **Comprehensive logging**: Detailed logging for debugging
- 💾 **JSON output**: Save results in structured JSON format

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Install Dependencies

```bash
# Clone or download the files
# Navigate to the project directory

# Install required packages
pip install -r requirements.txt

# Or install manually
pip install requests beautifulsoup4 lxml
```

### Alternative Installation

```bash
# Install using setup.py
python setup.py install

# Or install in development mode
pip install -e .
```

## Usage

### Basic Usage

```bash
# Extract images from a single product URL
python product_image_extractor.py "https://amazon.in/dp/B08X123"

# Save results to JSON file
python product_image_extractor.py "https://flipkart.com/product/xyz" --output results.json

# Enable verbose logging
python product_image_extractor.py "https://myntra.com/item/abc" --verbose
```

### Command Line Options

```bash
python product_image_extractor.py --help
```

Options:
- `url`: Product URL to extract images from (required)
- `--output, -o`: Output file to save results (JSON format)
- `--verbose, -v`: Enable verbose logging

### Python API Usage

```python
from product_image_extractor import ProductImageExtractor

# Initialize extractor
extractor = ProductImageExtractor()

# Extract images from single URL
images = extractor.extract_images("https://amazon.in/dp/B08X123")
print(f"Found {len(images)} images")

# Get comprehensive product information
product_info = extractor.get_product_info("https://flipkart.com/product/xyz")
print(f"Product: {product_info.title}")
print(f"Price: {product_info.price}")
print(f"Images: {len(product_info.image_urls)}")

# Extract from multiple URLs
urls = [
    "https://amazon.in/dp/B08X123",
    "https://flipkart.com/product/xyz",
    "https://myntra.com/item/abc"
]
results = extractor.extract_multiple_products(urls)
```

## Supported Retailers

| Retailer | Status | Image Quality | Notes |
|----------|--------|---------------|-------|
| Amazon.in | ✅ Full Support | High | ASIN-based extraction |
| Flipkart | ✅ Full Support | High | PID-based extraction |
| Myntra | ✅ Full Support | High | Product ID extraction |
| AJIO | ✅ Full Support | High | Product ID extraction |
| Nykaa | ✅ Full Support | High | Product ID extraction |
| TataCliq | ✅ Full Support | High | Product ID extraction |

## File Structure

```
product-image-extractor/
├── product_image_extractor.py    # Main script
├── retailer_extractors.py        # Additional retailer extractors
├── utils.py                      # Utility functions
├── requirements.txt              # Python dependencies
├── setup.py                      # Setup script
├── README.md                     # This file
└── output/                       # Output directory (created automatically)
```

## Configuration

### Environment Variables

```bash
# Set logging level
export LOG_LEVEL=INFO

# Set output directory
export OUTPUT_DIR=./output

# Set rate limit delay (seconds)
export RATE_LIMIT_DELAY=1.0
```

### Configuration File

Create a `config.json` file:

```json
{
  "request_timeout": 10,
  "max_retries": 3,
  "rate_limit_delay": 1.0,
  "max_images_per_product": 5,
  "output_dir": "output",
  "log_file": "image_extractor.log"
}
```

## Examples

### Example 1: Amazon Product

```bash
python product_image_extractor.py "https://amazon.in/dp/B08X123456" --output amazon_product.json
```

Output:
```json
{
  "title": "iPhone 15 Pro Max - 256GB - Natural Titanium",
  "url": "https://amazon.in/dp/B08X123456",
  "retailer": "amazon",
  "price": "₹1,34,900",
  "description": "Latest A17 Pro chip with titanium design...",
  "image_urls": [
    "https://images-na.ssl-images-amazon.com/images/P/B08X123456.01.L.jpg",
    "https://images-na.ssl-images-amazon.com/images/P/B08X123456.02.L.jpg"
  ],
  "extraction_time": "2024-01-15 14:30:25"
}
```

### Example 2: Flipkart Product

```bash
python product_image_extractor.py "https://flipkart.com/product/xyz" --verbose
```

### Example 3: Myntra Product

```bash
python product_image_extractor.py "https://myntra.com/item/abc" --output myntra_product.json
```

## Troubleshooting

### Common Issues

1. **No images found**
   - Check if the URL is valid and accessible
   - Verify the product page structure hasn't changed
   - Try with `--verbose` flag for detailed logging

2. **Rate limiting errors**
   - Increase the delay between requests
   - Use fewer concurrent requests
   - Check if the website has anti-bot measures

3. **Import errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version (3.8+ required)

4. **Permission errors**
   - Ensure write permissions for output directory
   - Check file system permissions

### Debug Mode

```bash
# Enable debug logging
python product_image_extractor.py "URL" --verbose

# Check log file
tail -f image_extractor.log
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational and research purposes only. Please respect the terms of service of the websites you're scraping and use responsibly. The authors are not responsible for any misuse of this tool.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the log files for error details

## Changelog

### Version 1.0.0
- Initial release
- Support for 6 major Indian e-commerce websites
- High-quality image extraction
- Comprehensive error handling
- JSON output format
- Rate limiting and validation