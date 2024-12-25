



import { MdOutlineDone } from 'react-icons/md';
import { RxCross2 } from 'react-icons/rx';
import { Task, useTask } from '../../../context/Task.context';

const AllTask = () => {
    const { tasks = [], deleteTaskById, editTaskById } = useTask(); // Default to an empty array for `tasks`

    return (
        <>
            <div className="mb-3">
                <h1>All Tasks ({tasks?.length || 0})</h1>
            </div>
            <div className="flex-wrap d-flex justify-content-center align-items-center">
                {tasks && tasks.length > 0 ? (
                    tasks.map((cur: Task, i) => (
                        <div
                            key={i}
                            className="card border py-4 px-4 mx-2 my-2 col-sm-12 col-md-6 col-lg-3"
                        >
                            <h1
                                className={`card-heading ${
                                    cur.isComplete ? 'text-decoration-line-through' : ''
                                }`}
                            >
                                {cur.title}
                            </h1>
                            <p className="card-body">{cur.description}</p>
                            <div className="d-flex">
                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteTaskById(cur._id)}
                                    title="Delete"
                                    className="btn btn-outline-danger rounded-pill me-2"
                                >
                                    <RxCross2 />
                                </button>
                                {/* Mark as Complete Button */}
                                {!cur.isComplete && (
                                    <button
                                        onClick={() => editTaskById(cur._id)}
                                        title="Mark as Complete"
                                        className="btn btn-outline-primary rounded-pill"
                                    >
                                        <MdOutlineDone />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <h1 className="text-center text-decoration-underline">No Tasks Available</h1>
                )}
            </div>
        </>
    );
};

export default AllTask;
