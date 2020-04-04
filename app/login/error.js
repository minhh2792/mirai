module.exports = function({ error }) {
    if(!error.error) return error.toString();
    switch (error.error) {
        case "login-approval":
            return "Vui lòng đăng nhập vào tài khoản và mở checkpoint!"

            // break;
        case "Wrong username/password.":
            return "Sai tài khoản hoặc mật khẩu!"

            // break;
        default:
            return "Có lỗi xảy ra khi đăng nhập!"

            // break;
    }

}
