# Swag JMK Full-Stack App

Aplikasi E-Commerce sederhana yang meniru fungsionalitas aplikasi e-commerce standar, dibuat menggunakan teknologi Node.js/Express (Backend) dan Vanilla JavaScript/HTML/CSS (Frontend).

## Fitur Utama

* **Autentikasi Pengguna:** Login dengan berbagai status pengguna (standard, locked, performance glitch).
* **Pengelolaan Produk:** Menampilkan daftar produk yang diambil dari database.
* **Keranjang Belanja:** Menyimpan dan memperbarui data keranjang belanja per pengguna.
* **Simulasi Error:** Menyertakan simulasi delay pada saat login (performance_glitch_user).

## Deployment & Akses Cepat

Aplikasi ini di-deploy di platform cloud Railway.

**Link Aplikasi Live:**
[Akses Aplikasi di Sini] (https://swag-jmk-full-app-production.up.railway.app)

**Status Proyek:**
Proyek ini berjalan stabil dan terhubung ke database SQLite.

## Stack Teknologi

| Tipe | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Backend** | Node.js, Express.js | Kerangka kerja server utama. |
| **Database** | SQLite3 | Database relasional ringan untuk menyimpan data users dan products. |
| **Frontend** | HTML5, CSS3, JavaScript | Antarmuka pengguna (UI) dinamis. |

## Detail Database

Database menggunakan **SQLite** dengan 3 tabel utama: `users`, `products`, dan `carts`.

### Contoh Akun Login (Case-sensitive)

| Username | Password | Status | Catatan |
| :--- | :--- | :--- | :--- |
| `user` | `00` | Active | Akun standar. |
| `locked` | `00` | Locked | Tidak bisa login (simulasi error 403). |
| `glitch` | `00` | Active | **Login akan mengalami delay 3 detik.** |

## Scenario Test Cases

Untuk memverifikasi fungsionalitas *full-stack* aplikasi, dijalankan skenario pengujian berikut.

### 1. Login & Pengambilan Data Produk (Sukses)

| Langkah | Akun | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| 1. Buka aplikasi. | N/A | Melihat halaman *login*. |
| 2. Input Username & Password. | `standard_user` / `secret_sauce` | **Login Sukses.** Pengguna dialihkan ke halaman produk, dan **semua 6 produk terlihat** (data diambil dari database SQLite). |

### 2. Simulasi Kinerja (Performance Glitch)

| Langkah | Akun | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| 1. Input Username & Password. | `performance_glitch_user` / `secret_sauce` | **Loading Screen Muncul Selama $\approx 3$ detik.** Kemudian, login sukses, pengguna dialihkan ke halaman produk. |

### 3. Simulasi Akun Terkunci (Locked Out)

| Langkah | Akun | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| 1. Input Username & Password. | `locked_out_user` / `secret_sauce` | **Login Gagal.** Muncul pesan error: "Epic sadface: Sorry, this user has been locked out." (Status HTTP 403). |

### 4. Pengujian Keranjang Belanja (Cart CRUD)

| Langkah | Akun | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| 1. Login. | `standard_user` / `secret_sauce` | **Login Sukses.** |
| 2. Tambahkan 2 produk berbeda ke keranjang. | N/A | Ikon keranjang menunjukkan (2), dan API `/api/cart` menyimpan 2 item baru di database. |
| 3. Logout dan Login kembali. | `standard_user` / `secret_sauce` | **Keranjang Persisten.** Ikon keranjang tetap menunjukkan (2), membuktikan data keranjang berhasil diambil dari database SQLite. |
| 4. Hapus semua item dari keranjang. | N/A | Ikon keranjang menunjukkan (0), dan API `/api/cart` menghapus data dari database. |

---
