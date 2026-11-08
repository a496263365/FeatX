# RepoSummary 应急服务

本目录原名 `PyBackend`，用于同门 RepoSummary 服务不可用时维持本地联调与演示流程。当前实现使用预设功能模板及扫描得到的文件路径生成摘要，并非正式的语义分析服务；生成的代码元素标识不代表真实解析出的代码实体。

保持 `featx_pybackend` Python 包名和 HTTP 接口不变，仅调整外层目录命名。

- `GET /health`：服务可用性。
- `POST /summary`：接收 projectId 和可选 hints，返回 runId。
- `GET /summary/{runId}`：返回阶段、状态和进度。
- 摘要写入 `SHARED_PROJECT_ROOT/<projectId>/summary.json`，主系统直接读取。

根目录 `./dev.sh restart` 启动。主系统上传后自动提交，也可在项目设置中重新生成。
服务接口与文件格式见现有接口约定。任务状态暂存在内存，重启会中断未完成任务；已生成文件保留。

## 服务选择与目录迁移

- 优先通过根目录 `.env` 中的 `REPOSUMMARY_HTTP_URL` 配置同门服务地址。
- 需要使用本地应急服务时，将其设为 `http://127.0.0.1:18091`（留空也使用此默认值），再运行 `./dev.sh restart`。配置外部服务时，连接失败不会静默回退。
- 从旧目录升级后，在没有执行中任务时运行 `./dev.sh restart`，重新生成 systemd 服务配置并加载新的工作目录。
