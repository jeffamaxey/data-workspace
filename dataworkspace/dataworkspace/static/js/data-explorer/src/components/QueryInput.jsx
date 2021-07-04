import React from 'react';
import { Input, Tabs } from 'antd';
import {useEffect, useRef, useState} from "react";
import ToolBar from "./ToolBar";

const { TextArea } = Input;

export default function QueryInput({
  onSubmit,
  queryId,
  queryName,
  queryDescription,
  initialQuery,
  onQuerySave,
}) {
  console.log('SETTING INITIAL STATE')
  const [query, setQuery] = useState(typeof initialQuery !== 'undefined' ? initialQuery : '');
  const [savedQuery, setSavedQuery] = useState({
    queryId: queryId,
    queryName: queryName,
    queryDescription: queryDescription,
    query: initialQuery,
  })
  const onKeyDown = e => {
    // Run the query on ctrl + enter
    if (e.keyCode === 13 && e.ctrlKey) onSubmit(query)
  }

  useEffect(() => {
    const func = e => onKeyDown(e);
    document.addEventListener('keydown', func);
    return () => {
      document.removeEventListener('keydown', func);
    };
  });

  const onQuerySaved = (saved) => {
    setSavedQuery({
      queryId: saved.id,
      queryName: saved.name,
      queryDescription: saved.description,
      query: query,
    });
    onQuerySave();
  }

  const onQueryDeleted = () => {
    console.log('setting query', savedQuery)
    setSavedQuery({
      queryId: undefined,
      queryName: savedQuery.queryName,
      queryDescription: savedQuery.queryDescription,
      query: query,
    });
    onQuerySave();
  }

  console.log('query', savedQuery);
  return (
    <div style={{height: '100%'}}>
      <h1>query id {savedQuery.queryId}</h1>
      <ToolBar
        onQuerySubmit={() => onSubmit(query)}
        {...savedQuery}
        onQuerySave={savedQuery => onQuerySaved(savedQuery)}
        onQueryDelete={() => onQueryDeleted()}
      />
      <TextArea
        style={{ height: '100%'}}
        className="query-input"
        value={query}
        placeholder="Enter your query here"
        onChange={e => setQuery(e.target.value)}
      />
    </div>
  )
}
