import {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  restoreProductService,
  getInactiveProductsService,
  getNextProductCodeService,
} from "../services/product.service.js";

// GET ALL ACTIVE PRODUCTS
export async function getProducts(req, res) {
  try {
    const products = await getProductsService();

    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diambil",
      data: products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil data produk",
    });
  }
}

// GET INACTIVE PRODUCTS
export async function getInactiveProducts(req, res) {
  try {
    const products = await getInactiveProductsService();

    return res.status(200).json({
      success: true,
      message: "Data produk nonaktif berhasil diambil",
      data: products,
    });
  } catch (error) {
    console.error("GET INACTIVE PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil data produk nonaktif",
    });
  }
}

// GET PRODUCT BY ID
export async function getProductById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
    }

    const product = await getProductByIdService(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data produk berhasil diambil",
      data: product,
    });
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengambil data produk",
    });
  }
}

// CREATE PRODUCT
// CREATE PRODUCT
export async function createProduct(req, res) {
  try {
    const {
      name,
      description,
      category,
      price,
      stock,
      minStock,
      unit,
      supplierId,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nama produk wajib diisi",
      });
    }

    if (price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Harga produk wajib diisi",
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock ?? 0);
    const numericMinStock = Number(minStock ?? 0);

    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Harga produk tidak valid",
      });
    }

    if (Number.isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stok produk tidak valid",
      });
    }

    if (
      Number.isNaN(numericMinStock) ||
      numericMinStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stok tidak valid",
      });
    }

    const image = req.file
      ? `/uploads/products/${req.file.filename}`
      : null;

    const product = await createProductService({
      name,
      description,
      category,
      price: numericPrice,
      stock: numericStock,
      minStock: numericMinStock,
      unit,
      supplierId,
      image,
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: product,
    });
  } catch (error) {
    console.error(
      "CREATE PRODUCT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Gagal menambahkan produk",
    });
  }
}

// UPDATE PRODUCT
export async function updateProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
    }

    const {
  name,
  description,
  category,
  price,
  stock,
  minStock,
  unit,
  supplierId,
  status,
} = req.body;

    const image = req.file
      ? `/uploads/products/${req.file.filename}`
      : undefined;

   const product = await updateProductService(id, {
  name,
  description,
  category,
  price,
  stock,
  minStock,
  unit,
  supplierId,
  image,
  status,
});

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Produk berhasil diperbarui",
      data: product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal memperbarui produk",
    });
  }
}

// DELETE PRODUCT / SOFT DELETE
export async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
    }

    const product = await deleteProductService(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Produk berhasil dinonaktifkan",
      data: product,
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal menonaktifkan produk",
    });
  }
}

// RESTORE PRODUCT
export async function restoreProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID produk tidak valid",
      });
    }

    const product = await restoreProductService(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Produk berhasil diaktifkan kembali",
      data: product,
    });
  } catch (error) {
    console.error("RESTORE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mengaktifkan kembali produk",
    });
  }
}

// GET NEXT PRODUCT CODE
export async function getNextProductCode(req, res) {
  try {
    const code = await getNextProductCodeService();

    return res.status(200).json({
      success: true,
      message: "Kode produk berhasil dibuat",
      data: code,
    });
  } catch (error) {
    console.error("GET NEXT PRODUCT CODE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Gagal mendapatkan kode produk",
    });
  }
}

