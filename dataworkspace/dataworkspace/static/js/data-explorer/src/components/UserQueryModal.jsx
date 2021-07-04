import React, { useState } from "react";
import {Modal, Button, Form, Input, notification} from 'antd';
import TextArea from "antd/es/input/TextArea";

export default function UserQueryModal({ visible, queryId, queryName, queryDescription, query, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const validateMessages = {
    required: '${label} is required!',
  }
  const [form] = Form.useForm();
  const onOk = () => {
    form.submit();
  };

  const saveQuery = formValues => {
    setSaving(true);
    const isUpdate = typeof queryId !== 'undefined';
    let endpoint = '/data-explorer/api/user-queries' + (isUpdate ? `/${queryId}` : '');
    console.log({...formValues,
          query: query})
    fetch(endpoint, {
      method: isUpdate ? 'PUT': 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify({
          ...formValues,
          sql: query,
        }),
      })
      .then(function(resp) {
        setSaving(false);
        if(resp.ok) return resp.json();
        notification.error({
          message: 'Error saving query',
          description:
            'An unknown error occurred while trying to save your query.',
        });
        throw new Error('Failed to save query');
      })
      .then(resp => {
        onSaved({...formValues, id: resp.id});
      });
  }
  return (
    <Modal
      title="Save query"
      visible={visible}
      onCancel={() => onClose()}
      onOk={onOk}
      confirmLoading={saving}
    >
      <Form.Provider
        onFormFinish={(name, { values }) => {
          saveQuery(values.query);
        }}
      >
        <Form
          form={form}
          validateMessages={validateMessages}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 17 }}
        >
          <Form.Item
            name={['query', 'name']}
            label="Name"
            rules={[{ required: true }]}
            initialValue={queryName}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['query', 'description']}
            label="Description"
            initialValue={queryDescription}
          >
            <TextArea />
          </Form.Item>
        </Form>
      </Form.Provider>
    </Modal>
  )
}
