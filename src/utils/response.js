function mapNguoiDung(row) {
    return {
        id: row.id,
        email: row.email,
        hoTen: row.ho_ten,
        sdt: row.sdt,
        vaiTro: row.vai_tro,
    };
}

function mapCanHo(row) {
    return {
        id: row.id,
        toaNhaId: row.toa_nha_id,
        tenToaNha: row.ten_toa_nha,
        diaChiToaNha: row.dia_chi_toa_nha,
        maCanHo: row.ma_can_ho,
        dienTich: row.dien_tich,
        cuDan: row.cu_dan || [],
    };
}

module.exports = { mapNguoiDung, mapCanHo };
