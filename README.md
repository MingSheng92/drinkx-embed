# drinkx-embed
A simple, embeddable menu widget.

## Usage

To use the menu embed on your website, you need to include the CSS and JavaScript files in your HTML. It is recommended to host these files on a CDN like jsDelivr for the best performance.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/your-username/drinkx-embed@main/dist/drinkx-embed.min.css">
<script src="https://cdn.jsdelivr.net/gh/your-username/drinkx-embed@main/dist/drinkx-embed.min.js" defer></script>
```

*Replace `your-username` with your GitHub username.*

### Method 1: Automatic Initialization

The easiest way to use the embed is to add the `data-menu-embed` attribute to a container element. You must also provide your venue ID with the `data-venue-id` attribute.

```html
<div data-menu-embed data-venue-id="YOUR_VENUE_ID"></div>
```

### Method 2: Manual Initialization

If you need more control, you can initialize the script manually with JavaScript.

```html
<div id="menu-container"></div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        window.MenuEmbed.create('menu-container', {
            venueId: 'YOUR_VENUE_ID',
            // You can override other options here
            // theme: 'dark'
        });
    });
</script>
```

For a complete, working example, see the [examples/index.html](examples/index.html) file.

## Building from Source

To build the project from source, you will need to have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Build the project:**

    You can build the project in two ways:

    *   **For production (minified):**
        ```bash
        npm run build
        ```
        This will create a minified version of the script at `dist/drinkx-embed.min.js`.

    *   **For development (non-minified):**
        ```bash
        npm run build:dev
        ```
        This will create a non-minified version of the script at `dist/drinkx-embed.js`. 
