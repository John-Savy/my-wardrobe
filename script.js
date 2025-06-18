document.getElementById("upload-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const imageInput = document.getElementById("image-upload");
    const category = document.getElementById("category").value;

    if (!imageInput.files[0]) {
        alert("Please choose an image.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;

        // Show image on the page
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

        // Send data to your new API
        const newItem = {
            image: imageUrl,
            category: category
        };

        fetch("https://my-json-server.typicode.com/john-savy/my-wardrobe-api/wardrobe",  {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newItem)
        }).then(() => {
            imageInput.value = ""; // Clear the input
        });

    };

    reader.readAsDataURL(imageInput.files[0]);
});