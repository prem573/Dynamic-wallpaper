import React, { useState, useEffect, useRef, useCallback } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Swal from "sweetalert2";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";

function App() {
  const [images, setImages] = useState([]);
  const [current, setCurrent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fetched = useRef(false);

  // Fetch wallpapers (now with useCallback for stability)
  const fetchWallpapers = useCallback(async () => {
    try {
      const response = await fetch("https://premchand.tech/wallpaper/list.php");
      const data = await response.json();
      if (Array.isArray(data.images)) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
    }
  }, []);

  // Fetch wallpapers on mount
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchWallpapers();
  }, [fetchWallpapers]);

  // Fetch current wallpaper
  useEffect(() => {
    const fetchCurrentWallpaper = async () => {
      try {
        const response = await fetch("http://localhost:5000/current-wallpaper");
        const data = await response.json();
        setCurrent(data.wallpaper);
      } catch (error) {
        console.error("Error fetching current wallpaper:", error);
      }
    };
    fetchCurrentWallpaper();
  }, []);

  const setWallpaper = async (imageUrl) => {
    try {
      const filename = imageUrl.split("/").pop();
      const response = await fetch("http://localhost:5000/set-wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrent(imageUrl);
        Swal.fire("Success", "Wallpaper set successfully!", "success");
      } else {
        Swal.fire("Error", "Failed to set wallpaper!", "error");
        console.log(data);
      }
    } catch (error) {
      console.error("Error setting wallpaper:", error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire("Warning", "Please select an image!", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post("https://premchand.tech/wallpaper/upload.php", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.status === "success") {
        Swal.fire("Success", "Image uploaded successfully!", "success").then(() => {
          setUploadProgress(0);
          setSelectedFile(null);
          fetchWallpapers(); // ✅ Refresh wallpaper list
        });
      } else {
        Swal.fire("Error", "Upload failed!", "error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Swal.fire("Error", "Something went wrong while uploading!", "error");
    }
  };

  const deleteWallpaper = async (imageUrl) => {
    try {
      const filename = imageUrl.split("/").pop();
      const response = await axios.post("https://premchand.tech/wallpaper/delete.php", new URLSearchParams({ filename }));

      if (response.data.status === "success") {
        Swal.fire("Deleted!", "The wallpaper has been deleted.", "success");
        setImages(images.filter(img => img !== imageUrl));
      } else {
        Swal.fire("Error", "Failed to delete wallpaper.", "error");
      }
    } catch (error) {
      console.error("Error deleting wallpaper:", error);
      Swal.fire("Error", "Something went wrong while deleting!", "error");
    }
  };

  return (
    <div className="container text-center mt-4">
      <h1 className="text-primary">Wallpaper Manager</h1>

      <div className="mb-3">
        <input
          type="file"
          className="form-control"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
        />
        <div className="progress mt-2">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        <button className="btn btn-primary mt-2" onClick={handleUpload}>
          Upload Image
        </button>
      </div>

      {/* Current Wallpaper */}
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

      {/* Available Wallpapers */}
      <h2>Available Wallpapers</h2>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
        {images.map((img, index) => (
          <div key={index} style={{ position: "relative", margin: "10px" }}>
            <img
              src={img}
              alt="Wallpaper"
              onClick={() => setWallpaper(img)}
              style={{
                width: "150px",
                height: "100px",
                cursor: "pointer",
                border: current === img ? "3px solid blue" : "3px solid transparent",
                borderRadius: "5px",
              }}
            />
            <span
              className="btn-danger rounded p-2 btn waves-effect waves-light"
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                cursor: "pointer",
                zIndex: 10,
              }}
              onClick={() => deleteWallpaper(img)}
            >
              <i className="fa fa-trash"></i>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
