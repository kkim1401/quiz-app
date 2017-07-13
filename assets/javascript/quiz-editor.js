/**
 * Created by Kevin_Kim on 4/2/17.
 */

function QuestionHeader(props) {
    return (
        <div className="question-row group">
            <Delete/>
            <section className="question-type">
                <h3>Question Type</h3>
                <select value={props.type}>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-the-blank">Fill-In-The-Blank</option>
                    <option value="drag-and-drop">Drag-and-Drop</option>
                </select>
            </section>
            <section className="question">
                <h3>Question</h3>
                <textarea type="text" name="question" value={props.question}/>
            </section>
        </div>
    );
}

function FillInTheBlank(props) {
    return (
        <section className="question-body">
            <QuestionHeader type={props.type} question={props.question}/>
            <section className="correct-answer">
                <h3>Correct Answer</h3>
                <input type="text" name="correct-answer" value={props.answer}/>
            </section>
        </section>
    )
}

function MultipleChoice(props) {
    const choices = props.choices,
        letters = [],
        numberOfChoices = choices.length;
    for (let i = 0; i < numberOfChoices; i++) {
        letters.push(String.fromCharCode("A".charCodeAt(0) + i));
    }
    return (
        <section className="question-body group">
            <QuestionHeader type={props.type} question={props.question}/>
            <section className="correct-choice">
                <h3>Correct Choice</h3>
                <select>
                    {letters.map(letter => <option value={letter} key={letter}>{letter}</option>)}
                </select>
            </section>
            <section className="mult-choices">
                <h3>Answer Choices</h3>
                {choices.map((choice, index) => (
                    <div>
                        <p>{letters[index]}</p>
                        <input type="text" name="blank" key={index} value={choice}/>
                    </div>
                ))}
                <Addition/>
            </section>
        </section>
    )
}

function DragAndDrop(props) {
    const numberOfChoices = props.choices,
        inputs = [];
    for (let i = 0; i < numberOfChoices; i++) {
        inputs.push(<input type="text" key={i} value={props.choices}/>);
    }
    return (
        <section className="question-body">
            <QuestionHeader type={props.type} question={props.question}/>
            <section className="choices">
                <h3>Answer Choices</h3>
                {inputs}
                <Addition/>
            </section>
        </section>
    )
}

function Addition(props) {
    return <button name="addition">Add</button>
}

function Delete(props) {
    return <button name="delete">Delete</button>
}

class EditorBody extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            questions: []
        }
    }
    componentWillMount() {
        fetch("assets/javascript/questions.json")
            .then(response => response.json())
            .then(questions => this.setState({questions}))
    }
    render() {
        const data = this.state.questions,
            questions = data.map(question => {
            switch (question.type) {
                case "multiple-choice":
                    return <MultipleChoice
                        type={question.type}
                        choices={question.choices}
                        question={question.question}
                        correctIndex={question.correctIndex}/>;
                case "drag-and-drop":
                    return <DragAndDrop
                        type={question.type}
                        choices={question.items}
                        question={question.question}
                        answers={question.answers}/>;
                case "fill-in-the-blank":
                    return <FillInTheBlank
                        type={question.type}
                        question={question.question}
                        answer={question.answer}
                    />
            }
        });
        return (
            <section className="editor-body">
                {questions}
                <Addition/>
            </section>
        )
    }
}

ReactDOM.render(
    <EditorBody/>,
    document.getElementsByClassName("quiz-editor")[0]
);