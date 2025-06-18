document.addEventListener("DOMContentLoaded", function() {
    // Load existing items from API when the page opens
    fetch("https://my-json-server.typicode.com/john-savy/my-wardrobe-api/wardrobe") 
        .then(response => response.json())
        .then(items => {
            items.forEach(item => {
                showWardrobeItem(item.image, item.category);
            });
        });

    // Handle form submission
    document.getElementById("upload-form").addEventListener("submit", function(event) {
        event.preventDefault();

        const imageInput = document.getElementById("image-upload");
        const category = document.getElementById("category").value;

        if (!imageInput.files[0]) {
            alert("Please choose an image.");
            return;
        }

        const file = imageInput.files[0];

        // Show preview of AVIF (or any image)
        const imageUrl = URL.createObjectURL(file);

        // Show image on the webpage
        showWardrobeItem(imageUrl, category);

        // Read the file as base64 to send to API
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;

            // Send data to your API
            const newItem = {
                image: base64Image,
                category: category
            };

            fetch("https://my-json-server.typicode.com/john-savy/my-wardrobe-api/wardrobe",  {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(newItem)
            }).then(() => {
                imageInput.value = ""; // Clear the upload field
            });
        };

        reader.readAsDataURL(file);
    });
});

// Helper function to show images on the page
function showWardrobeItem(imageUrl, category) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "wardrobe-item";

    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "Clothing item in category: " + category;

    const caption = document.createElement("p");
    caption.textContent = category;

    itemDiv.appendChild(img);
    itemDiv.appendChild(caption);
    document.getElementById("wardrobe-items").appendChild(itemDiv);
}
