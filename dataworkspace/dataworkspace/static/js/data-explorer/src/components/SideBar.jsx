import React, {useEffect, useState} from "react";
import { Layout, Menu, Tooltip } from "antd";
import { SaveFilled, DatabaseFilled, ContainerOutlined, SaveOutlined, TableOutlined, SyncOutlined } from "@ant-design/icons";

const { Sider } = Layout;
const { SubMenu } = Menu;

export default function SideBar({
  collapsed,
  onCollapse,
  onSchemaOpen,
  schemaLoaded,
  schema,
  onTableSelect,
  onSavedQueriesOpen,
  savedQueriesLoaded,
  savedQueries,
  onSavedQuerySelect,
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(250);
  const minWidth = 200;
  const maxWidth = 600;

  const onMouseDown = e => {
    e.preventDefault();
    setIsResizing(true);
  };

  const onMouseUp = e => {
    setIsResizing(false);
  };

  const onMouseMove = e => {
    if (isResizing && !collapsed) {
      let offset = e.clientX - document.body.offsetLeft;
      if (offset > minWidth && offset < maxWidth) {
        setWidth(offset);
      }
      else if (offset < minWidth) {
        setWidth(minWidth);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  });

  const schemaMenuClick = () => {
    if (!schemaLoaded) onSchemaOpen();
  }

  const queryMenuClick = () => {
    if (!savedQueriesLoaded) onSavedQueriesOpen();
  }

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={onCollapse} theme="dark" width={width}>
      <div
          style={{
            position: "absolute",
            width: "5px",
            padding: "4px 0 0",
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            cursor: "ew-resize",
            backgroundColor: "#eff2f5"
          }}
          onMouseDown={onMouseDown}
        />
      <Menu theme="dark" mode="inline" inlineIndent={12} selectable={false}>
        <SubMenu key="database" icon={<DatabaseFilled />} title="Database" onTitleClick={schemaMenuClick}>
          {schemaLoaded ?
              <>
                {schema.map(s => (
                  <SubMenu key={s.schema} icon={<ContainerOutlined/>} title={s.schema}>
                    {s.tables.map(t => (
                      <Menu.Item
                        style={{userSelect: "none"}}
                        key={`${s.schema}-${t}`}
                        icon={<TableOutlined/>}
                        onDoubleClick={() => {
                          onTableSelect(s.schema, t)
                        }}
                      >
                        <Tooltip title={`${s.schema}.${t}`}>
                          {t}
                        </Tooltip>
                      </Menu.Item>
                    ))}
                  </SubMenu>
                ))}
              </>
              : <Menu.Item key="loading-schemas"><SyncOutlined spin /> Loading schemas</Menu.Item>}
        </SubMenu>
        <SubMenu key="queries" icon={<SaveFilled />} title="Saved queries" onTitleClick={queryMenuClick}>
          {savedQueriesLoaded ?
            <>
              {savedQueries.map(q => (
                <Menu.Item
                  key={q.id}
                  icon={<SaveOutlined />}
                  style={{userSelect: "none"}}
                  onDoubleClick={e => {
                      e.preventDefault();
                      onSavedQuerySelect(q.id);
                  }}
                >
                  <Tooltip title={q.description}>
                    {q.name}
                  </Tooltip>
                </Menu.Item>
              ))}
            </>
            : <Menu.Item key="loading-queries"><SyncOutlined spin /> Loading queries</Menu.Item>}
        </SubMenu>
      </Menu>
    </Sider>
  )
}
