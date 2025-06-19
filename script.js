document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upload-form");
    const wardrobeDiv = document.getElementById("wardrobe-items");

    // Function to upload image and save outfit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const category = document.getElementById("category").value;
        const fileInput = document.getElementById("image-upload");
        const file = fileInput.files[0];

        if (!file) {
            alert("Please select an image");
            return;
        }

        try {
            // Upload image to Firebase Storage
            const fileRef = firebase.ref(firebase.storage, `wardrobe/${file.name}`);
            await firebase.uploadBytes(fileRef, file);
            const imageUrl = await firebase.getDownloadURL(fileRef);

            // Save to Firestore
            await firebase.addDoc(firebase.collection(firebase.db, "wardrobe"), {
                category,
                imageUrl,
                createdAt: new Date()
            });

            alert("Item added to wardrobe!");
            fileInput.value = ""; // Clear input
        } catch (error) {
            console.error("Error uploading item:", error);
            alert("Error uploading item");
        }
    });

    // Load and display all items from Firebase
    firebase.onSnapshot(firebase.collection(firebase.db, "wardrobe"), (snapshot) => {
        wardrobeDiv.innerHTML = ""; // Clear current list

        snapshot.forEach((doc) => {
            const item = doc.data();
            const itemDiv = document.createElement("div");
            itemDiv.className = "wardrobe-item";

            itemDiv.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.category}" style="width: 150px; height: auto;">
                <p>${item.category}</p>
            `;
            wardrobeDiv.appendChild(itemDiv);
        });
    });
});