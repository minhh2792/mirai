<h1 align="center">
	<br>
	<a href="#"><img src="https://i.imgur.com/jdqeKHq.jpg" alt="Mirai"></a>
	<br>
		Mirai Bot
	<br>
</h1>

<h4 align="center"></h4>

<p align="center">
	<img alt="size" src="https://img.shields.io/github/repo-size/roxtigger2003/mirai.svg?style=flat-square&label=size">
	<img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=red&label=code%20version&prefix=v&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Froxtigger2003%2Fmirai%2Fmaster%2Fpackage.json&style=flat-square">
	<a href="https://github.com/roxtigger2003/mirai/commits"> <img alt="commits" src="https://img.shields.io/github/commit-activity/m/roxtigger2003/mirai.svg?label=commit&style=flat-square"></a> 
</p>

<h4 align="center"></h4>

<p align="center">
	<a href="#Overview">Tổng Quát Về Bot</a>
	-
	<a href="#Installation">Hướng Dẫn Cài Đặt</a>
	-
	<a href="#Author">Tác Giả</a>
</p>

# Overview

Source code này có thể biến tài khoản facebook của bạn thành một con bot thông minh, nhanh nhẹn!


# Installation 

## Yêu cầu để có thể sử dụng bot:

   - [npm và nodejs phiên bản mới nhất](https://nodejs.org/en/) và [git(không bắt buộc)](https://git-scm.com/downloads)
 
   - Trình độ sử dụng nodejs ở mức trung bình
 
   - Một tài khoản facebook, lưu ý sử dụng clone chứ đừng dùng tài khoản chính!
 
## Sau đây là hướng dẫn cài đặt:  

+ Step 1: bạn phải clone hoặc download về, nếu máy bạn có git hãy sử dụng lệnh:
```
git clone https://github.com/roxtigger2003/mirai
```
+ Step 2: Trỏ và bắt đầu cài đặt các gói module cần thiết cho bot cũng như file env:
```
cd mirai
npm install
cp .env.example .env
```
sau khi xong các dòng lệnh trên bạn hãy mở file env và edit nó
+ Step 3: sau khi bạn chỉnh sửa, thiếp lập cho bot thì cũng là lúc các modules cài đặt thành công bạn hãy gõ vào cmd hoặc terminal:
```
node login.js và sau đó nhập mã xác thực 2 lớp
```
+ Step 6: sau khi node login.js và nhập mã thành công, cmd hoặc terminal sẽ xuất ra 1 dòng rất dài báo hiệu là appstate đã ghi thành công thì bạn đã có thể khởi động bot bằng cách gõ: 
```
npm start
```

## Video hướng dẫn deploy và sử dụng trên glitch:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/-M0-GLPxA-k/0.jpg)](https://www.youtube.com/watch?v=-M0-GLPxA-k)

## Deployment

Click this button:

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/roxtigger2003/mirai)    [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/VNBot-Developers/karma/tree/master)

# Author

- **CatalizCS** - *Author and coder* - [GitHub](https://github.com/roxtigger2003) - [Facebook](https://fb.me/Cataliz2k)

- **SpermLord** - *Coder and fix bug :v* - [GitHub](https://github.com/spermlord)

**Và cùng nhiều anh em tester đã đồng hành cùng project xuống gần 4 tháng! mình xin cám ơn!!**

## License

This project is licensed under the GNU General Public License v3.0 License - see the [LICENSE](LICENSE) file for details
