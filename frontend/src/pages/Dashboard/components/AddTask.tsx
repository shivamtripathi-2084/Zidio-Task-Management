import { ErrorMessage, Field, Form, Formik, FormikHelpers } from 'formik'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import * as yup from 'yup'
import { useTask } from '../../../context/Task.context'
import { ManagedUser, useAuth } from '../../../context/Auth.context'

const AddTask = () => {
    const {addTask} = useTask()
    const {getUsers} = useAuth()
    const [editors, setEditors] = useState<ManagedUser[]>([])
    type AddTask = {
        title: string
        desc: string
        dueDate: string
        priority: "low" | "medium" | "high"
        assignees: string[]
    }
    const validationSchema = yup.object().shape({
        title: yup.string().required("Title is required"),
        desc: yup.string().required("Description is Required"),
        dueDate: yup.string().nullable().optional(),
        priority: yup.string().oneOf(["low", "medium", "high"]).required("Priority is required"),
        assignees: yup.array().of(yup.string().required()).max(20, "Select no more than 20 editors").required()
    })

    const initalValues: AddTask = {
        desc: '',
        title: '',
        dueDate: '',
        priority: 'medium',
        assignees: []
    }

    useEffect(() => {
        getUsers()
            .then((users) => setEditors(users.filter((member) => member.role === 'editor')))
            .catch((error: Error) => toast.error(error.message))
    }, [getUsers])

    const onSubmitHandler = async (e: AddTask, { resetForm }: FormikHelpers<AddTask>) => {
        try {
              await addTask(e.title,e.desc, e.dueDate || null, e.priority, e.assignees)
              resetForm()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Unable to add task')
        }
    }

    return (
        <>
            <Formik validationSchema={validationSchema} initialValues={initalValues} onSubmit={onSubmitHandler} >
                <Form className='col-sm-12 mx-auto'>
                    <div className="mb-3">
                        <h1>Add Task</h1>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="title">Title <span className="text-danger">*</span> </label>
                        <Field name="title" id="title" type="text" className="form-control" />
                        <ErrorMessage name='title' component={'p'} className='text-sm text-danger' />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="desc">Desc <span className="text-danger">*</span> </label>
                        <Field as="textarea" rows="3" className="form-control" name="desc" id="desc" />
                        <ErrorMessage name='desc' component={'p'} className='text-sm text-danger' />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="dueDate">Due Date</label>
                        <Field name="dueDate" id="dueDate" type="date" className="form-control" />
                        <ErrorMessage name='dueDate' component={'p'} className='text-sm text-danger' />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="priority">Priority</label>
                        <Field as="select" name="priority" id="priority" className="form-control">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Field>
                        <ErrorMessage name='priority' component={'p'} className='text-sm text-danger' />
                    </div>
                    <div className="mb-3">
                        <label>Assign to editors (optional)</label>
                        <div className="border rounded p-2">
                            {editors.length ? editors.map((editor) => (
                                <label key={editor._id} className="form-check d-flex align-items-center gap-2">
                                    <Field type="checkbox" name="assignees" value={editor._id} className="form-check-input mt-0" />
                                    <span>{editor.name} ({editor.email})</span>
                                </label>
                            )) : <span className="text-muted">No editor accounts available.</span>}
                        </div>
                        <small className="text-muted">Select one or more editors. Their account IDs are saved automatically; leave blank to keep the task unassigned.</small>
                        <ErrorMessage name='assignees' component={'p'} className='text-sm text-danger' />
                    </div>
                    <div className="mb-3">
                        <button type="submit" className="btn btn-dark">Add Task</button>
                    </div>
                </Form>
            </Formik>

        </>
    )
}


export default AddTask
