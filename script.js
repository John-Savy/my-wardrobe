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
        const itemDiv = document.createElement("div");
        itemDiv.className = "wardrobe-item";

        const img = document.createElement("img");
        img.src = e.target.result;

        const caption = document.createElement("p");
        caption.textContent = category;

        itemDiv.appendChild(img);
        itemDiv.appendChild(caption);

        document.getElementById("wardrobe-items").appendChild(itemDiv);

        imageInput.value = ""; // Clear the upload field
    };

    reader.readAsDataURL(imageInput.files[0]);
});