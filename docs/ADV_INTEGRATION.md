# ADV·BATTERY 资源目录联动

来源仓库：[jimjury/ADV-BATTERY-Dataset-Collection](https://github.com/jimjury/ADV-BATTERY-Dataset-Collection)。原仓库完整保存资源目录、数据–论文关联和多语言资料，其目录仍是权威主副本；CellScope Lab 不修改或复制维护源数据库，也不镜像数据原件。

## 在线联动

浏览器并行读取公开 GitHub Raw JSON：

- `https://raw.githubusercontent.com/jimjury/ADV-BATTERY-Dataset-Collection/main/data/datasets.json`
- `https://raw.githubusercontent.com/jimjury/ADV-BATTERY-Dataset-Collection/main/data/papers.json`

优先显示数据集 `id, name_zh/name_en, institution, year, chemistry, research_tags, test_conditions_note, license_as_recorded, source_url, access_url, download_catalog_status`，以 `related_paper_ids` 或论文 `linked_dataset_ids` 连接。只打开经 `https:` 校验的来源链接（新标签+noopener/noreferrer）；动态内容通过 `textContent` 创建，避免把外部目录字符串作为 HTML 执行。

网络超时、CORS 或 GitHub Raw 访问受阻时，在页面标明“离线回退”，展示 CellScope 已有的 12 条来源/导入协议，并提供主目录入口及刷新按钮。**不要误认为完整 ADV 目录只有 12 条。**

ADV 主库在 2026-11-07 的发布说明为 114 条资源、105 条数据集、111 条文献/目录记录、72 条数据–文献关联，数字可能变化，网站以实时实际获取为准。当前 CellScope 只读取 datasets/papers，不复制其庞大的中文资料页或全部 CSV 导出工具，属于“面向科研训练的联动目录”，不是 ADV 本体的 1:1 替代品。

## 不承诺的事项

- 目录链接、版权和许可证未经本项目逐条实时认证，不能据此断言数据可自由商业使用。
- 不能断言所有目录数据已完成规范化、SOC/SOH/RUL 标签齐全、或能直接喂给 CellScope CLI。
- 不能假装网页的数据搜索会直接下载第三方原始数据，也不能未经许可把数据上传到 GitHub。
- 对应论文是否完整复现要依据真实文件、训练协议、标签定义进行逐项核查。
