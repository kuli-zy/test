# Spring Boot 贪吃蛇

一个使用 Java + Spring Boot 实现核心游戏逻辑的完整贪吃蛇项目。浏览器负责画面渲染和键盘/触屏输入，蛇移动、碰撞检测、食物生成、计分、等级和速度控制均由 Java 后端处理。

## 功能

- 24×24 游戏地图
- Java 后端维护游戏状态
- 撞墙 / 撞自身判定
- 随机食物生成
- 得分与最高分
- 每 50 分升级并加速
- 开始、暂停、继续、重新开始
- 方向键和 WASD 控制
- 手机触屏方向按钮
- 每个浏览器 Session 独立游戏状态
- 响应式页面

## 技术栈

- Java 17
- Spring Boot 3.5.5
- Maven
- HTML5 Canvas
- Vanilla JavaScript
- CSS3

## 运行

确保已安装 JDK 17+ 和 Maven，然后执行：

```bash
mvn spring-boot:run
```

浏览器打开：

```text
http://localhost:8080
```

也可以先打包：

```bash
mvn clean package
java -jar target/snake-game-0.0.1-SNAPSHOT.jar
```

## REST API

- `GET /api/game/info`：服务信息
- `GET /api/game/state`：当前游戏状态
- `POST /api/game/start`：开始 / 继续
- `POST /api/game/pause`：暂停
- `POST /api/game/restart`：重新开始
- `POST /api/game/tick`：推进一帧
- `POST /api/game/move`：改变方向，请求体示例：`{"direction":"up"}`

## 项目结构

```text
src/main/java/com/example/snake/
├── SnakeGameApplication.java
├── api/
│   └── GameController.java
└── game/
    └── SnakeGameService.java

src/main/resources/static/
├── index.html
├── styles.css
└── game.js
```

## 操作方式

- ↑ / W：向上
- ↓ / S：向下
- ← / A：向左
- → / D：向右
- Space：暂停 / 继续
