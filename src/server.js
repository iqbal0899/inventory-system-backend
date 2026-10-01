import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5100;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});