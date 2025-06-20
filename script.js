// Replace with your Supabase credentials
const SUPABASE_URL = "https://dupstqpmfgjjtuahgxpv.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cHN0cXBtZmdqanR1YWhneHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTY3MDgsImV4cCI6MjA2NTg5MjcwOH0.q6JFUZbQ4_ZuhhylACj4yREWUd5xWQFCqlBfeOBXAuM";

// Replace with your valid Gemini API key
const GEMINI_API_KEY = "AIzaSyBRk210azJYt_73G1yHZxHn5Kw19hpmF2E";

// Initialize Supabase client
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
    const customName = document.getElementById("custom-name").value.trim();

    if (!file) {
      alert("Please select an image");
      return;
    }

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

    // Save metadata to database including custom name and image URL
    const { error: dbError } = await supabase
      .from("wardrobe_items")
      .insert([
        { 
          category, 
          image_url: imageUrl,
          custom_name: customName || null
        }
      ]);

    if (dbError) {
      console.error("DB Error:", dbError.message);
      alert("❌ Failed to save item.\n" + dbError.message);
      return;
    }

    alert("✅ Item added!");
    await loadWardrobe(); // Refresh list
    fileInput.value = "";
    document.getElementById("custom-name").value = "";
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

      const displayName = item.custom_name 
        ? `${item.custom_name} (${item.image_url})` 
        : `${item.image_url.split('/').pop()} (${item.image_url})`;

      div.innerHTML = `
        <img src="${item.image_url}" alt="${item.category}" style="width:150px;">
        <p><strong>${item.category}</strong></p>
        <p>Name: ${item.custom_name ? item.custom_name : item.image_url.split('/').pop()}</p>
        <label>
          <input type="checkbox" ${item.in_laundry ? "checked" : ""} onchange="toggleLaundry('${item.id}', this.checked)">
          In Laundry
        </label>
        <br>
        <button onclick="deleteItem('${item.id}')">Delete</button>
        <hr>
      `;

      wardrobeDiv.appendChild(div);
    });
  }

  // Toggle laundry status
  window.toggleLaundry = async (id, status) => {
    const { error } = await supabase
      .from("wardrobe_items")
      .update({ in_laundry: status })
      .eq("id", id);

    if (error) {
      console.error("Update failed:", error.message);
      alert("❌ Failed to update laundry status");
      return;
    }

    await loadWardrobe(); // Refresh view
  };

  // Delete item
  window.deleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("wardrobe_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete failed:", error.message);
      alert("❌ Failed to delete item");
      return;
    }

    await loadWardrobe(); // Refresh view
    alert("✅ Item deleted");
  };

  // Copy wardrobe info for AI
  window.copyWardrobeToPrompt = async () => {
    const { data, error } = await supabase.from("wardrobe_items").select("*");
    if (error) {
      alert("Failed to load wardrobe data.");
      return;
    }

    const categories = {
      tops: [],
      bottoms: [],
      shoes: [],
      accessories: [],
      in_laundry: []
    };

    data.forEach(item => {
      const displayName = item.custom_name 
        ? `${item.custom_name} (${item.image_url})` 
        : `${item.image_url.split('/').pop()} (${item.image_url})`;

      switch (item.category) {
        case 'top': 
          categories.tops.push(displayName); 
          break;
        case 'bottom': 
          categories.bottoms.push(displayName); 
          break;
        case 'shoes': 
          categories.shoes.push(displayName); 
          break;
        case 'accessories': 
          categories.accessories.push(displayName); 
          break;
      }

      if (item.in_laundry) {
        categories.in_laundry.push(displayName);
      }
    });

    const prompt = `
Here are my clothes:
Tops: ${categories.tops.length ? categories.tops.join(", ") : "None"}
Bottoms: ${categories.bottoms.length ? categories.bottoms.join(", ") : "None"}
Shoes: ${categories.shoes.length ? categories.shoes.join(", ") : "None"}
Accessories: ${categories.accessories.length ? categories.accessories.join(", ") : "None"}
In Laundry: ${categories.in_laundry.length ? categories.in_laundry.join(", ") : "None"}

Suggest an outfit for me.
`;

    document.getElementById("ai-prompt").value = prompt.trim();
    const textarea = document.getElementById("ai-prompt");
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile
    document.execCommand("copy");

    alert("📋 Clothes info copied to clipboard!");
  };

  // Get AI suggestion using Gemini Vision API
  window.getAISuggestion = async () => {
    const { data, error } = await supabase.from("wardrobe_items").select("*");
    if (error) {
      alert("Failed to load wardrobe data.");
      return;
    }

    const categories = {
      tops: [],
      bottoms: [],
      shoes: [],
      accessories: [],
      in_laundry: []
    };

    const itemsWithImages = [];

    for (const item of data) {
      const displayName = item.custom_name 
        ? item.custom_name 
        : item.image_url.split('/').pop();

      switch (item.category) {
        case 'top': categories.tops.push(displayName); break;
        case 'bottom': categories.bottoms.push(displayName); break;
        case 'shoes': categories.shoes.push(displayName); break;
        case 'accessories': categories.accessories.push(displayName); break;
      }

      if (item.in_laundry) categories.in_laundry.push(displayName);

      try {
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        itemsWithImages.push({
          name: displayName,
          base64,
          mimeType: blob.type
        });
      } catch (err) {
        console.error("Error converting image to base64:", err);
      }
    }

    const prompt = `
You are a fashion expert analyzing my wardrobe.
Here are my clothes:
Tops: ${categories.tops.length ? categories.tops.join(", ") : "None"}
Bottoms: ${categories.bottoms.length ? categories.bottoms.join(", ") : "None"}
Shoes: ${categories.shoes.length ? categories.shoes.join(", ") : "None"}
Accessories: ${categories.accessories.length ? categories.accessories.join(", ") : "None"}
In Laundry: ${categories.in_laundry.length ? categories.in_laundry.join(", ") : "None"}

Please give me outfit ideas based on these items. Analyze the style, color, and patterns from the visual content provided.
`;

    try {
      const contents = [{
        parts: [{ text: prompt }]
      }];

      for (let i = 0; i < Math.min(itemsWithImages.length, 5); i++) {
        contents[0].parts.push({
          inline_data: {
            mime_type: itemsWithImages[i].mimeType,
            data: itemsWithImages[i].base64
          }
        });
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        throw new Error("AI request failed with status: " + response.status);
      }

      const result = await response.json();
      const suggestion = result.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestion received.";

      document.getElementById("ai-response").innerText = suggestion;

    } catch (error) {
      console.error("AI Error:", error);
      alert("❌ Failed to get AI suggestion. Check console for details.");
    }
  };

  // Initial load
  loadWardrobe();
});