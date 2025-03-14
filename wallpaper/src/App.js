import React, { useState, useEffect } from "react";

function App() {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState("");

  // Fetch the list of images
  const fetchWallpapers = async () => {
    try {
      const response = await fetch("http://localhost:5000/list-wallpapers");
      const data = await response.json();
      setImages(data.images);
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
    }
  };

  // Fetch the current wallpaper
  const fetchCurrentWallpaper = async () => {
    try {
      const response = await fetch("http://localhost:5000/current-wallpaper");
      const data = await response.json();
      setCurrent(data.wallpaper);
    } catch (error) {
      console.error("Error fetching current wallpaper:", error);
    }
  };

  useEffect(() => {
    fetchWallpapers();
    fetchCurrentWallpaper();
  }, []);

  const setWallpaper = async (imageUrl) => {
    try {
        const filename = imageUrl.split("/").pop(); // Extract filename

        const response = await fetch("http://localhost:5000/set-wallpaper", {
            method: "POST",
            headers: { "Content-Type": "application/json" }, // ✅ Set content type
            body: JSON.stringify({ filename }), // ✅ Send JSON
        });

        const data = await response.json();
        if (data.success) {
            setCurrent(imageUrl);
        } else {
            alert("Failed to set wallpaper");
        }
    } catch (error) {
        console.error("Error setting wallpaper:", error);
    }
};


  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Current Wallpaper</h2>
      {current ? (
        <img
          src={current}
          alt="Current Wallpaper"
          style={{
            width: "80%",
            borderRadius: "10px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        />
      ) : (
        <p>Loading...</p>
      )}

      <h2>Available Wallpapers</h2>
      <div
        style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}
      >
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt="Wallpaper"
            onClick={() => setWallpaper(img)}
            style={{
              width: "150px",
              height: "100px",
              margin: "10px",
              cursor: "pointer",
              border:
                current === img ? "3px solid blue" : "3px solid transparent",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
