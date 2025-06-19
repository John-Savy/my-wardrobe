// Replace with your Supabase credentials
const SUPABASE_URL = "https://dupstqpmfgjjtuahgxpv.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cHN0cXBtZmdqanR1YWhneHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTY3MDgsImV4cCI6MjA2NTg5MjcwOH0.q6JFUZbQ4_ZuhhylACj4yREWUd5xWQFCqlBfeOBXAuM";

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const wardrobeDiv = document.getElementById("wardrobe-items");

  // Upload new item
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = document.getElementById("category").value;
    const fileInput = document.getElementById("image-upload");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select an image");
      return;
    }

    // Generate unique filename
    const fileName = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from("wardrobe")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload failed:", uploadError.message);
      alert("❌ Failed to upload image.\n" + uploadError.message);
      return;
    }

    // Get public URL
    const { data } = supabase.storage.from("wardrobe").getPublicUrl(fileName);
    const imageUrl = data.publicUrl;

    // Save metadata to database
    const { error: dbError } = await supabase
      .from("wardrobe_items")
      .insert([
        { category, image_url: imageUrl }
      ]);

    if (dbError) {
      console.error("DB Error:", dbError.message);
      alert("❌ Failed to save item.\n" + dbError.message);
      return;
    }

    alert("✅ Item added!");
    await loadWardrobe(); // Refresh list
    fileInput.value = "";
  });

  // Load items from DB
  async function loadWardrobe() {
    const { data, error } = await supabase.from("wardrobe_items").select("*");
    if (error) {
      console.error("Load error:", error.message);
      wardrobeDiv.innerHTML = "<p>❌ Error loading wardrobe</p>";
      return;
    }

    wardrobeDiv.innerHTML = "";

    if (data.length === 0) {
      wardrobeDiv.innerHTML = "<p>No items in wardrobe yet.</p>";
      return;
    }

    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "wardrobe-item";
      div.innerHTML = `
        <img src="${item.image_url}" alt="${item.category}" style="width:150px;">
        <p>${item.category}</p>
      `;
      wardrobeDiv.appendChild(div);
    });
  }

  // Initial load
  loadWardrobe();
});
